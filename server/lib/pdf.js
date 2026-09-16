// PDF joints aux emails de confirmation : facture d'achat, confirmation d'essai. Document
// imprimable (fond blanc) : contrairement aux emails (lus à l'écran), une facture qu'on
// imprime ne doit pas gâcher d'encre avec un fond sombre.

const PDFDocument = require('pdfkit')
const { PAYMENT_METHOD_LABELS } = require('./emailTemplates')

const RED = '#e8000d'
const RED_TINT = '#fbeceb'
const DARK = '#161616'
const GRAY = '#767676'
const RULE = '#e2e2e2'
const MARGIN = 50
const WIDTH = 495 // largeur utile A4 (595 - 2 * MARGIN)

// Coordonnées affichées sur le papier à en-tête, reprises de la page Contact (déjà publiques).
const COMPANY = {
  address: '12 Avenue de la Promenade, 06000 Nice, France',
  phone: '+33 4 93 47 82 10',
  email: 'theo.ferrete@gmail.com',
}

// Ni toLocaleString('fr-FR') (l'espace fine insécable qu'il insère entre les milliers,
// U+202F, n'a pas de glyphe dans les polices standard non embarquées de pdfkit — rendue
// comme un « / » erratique au milieu du nombre) ni le symbole € (même souci de glyphe
// manquant) : les milliers sont regroupés à la main avec une espace ASCII normale.
function formatPrice(n) {
  const grouped = Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${grouped} EUR`
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function capitalize(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// FACT-2026-A1B2C3D4 : lisible, traçable au document source (8 premiers caractères de
// l'UUID), sans prétendre à une vraie numérotation séquentielle légale.
function formatDocNumber(prefix, id, date) {
  return `${prefix}-${new Date(date).getFullYear()}-${id.slice(0, 8).toUpperCase()}`
}

// Collecte le flux pdfkit en un seul Buffer, attachable tel quel à un email nodemailer.
function render(draw) {
  const doc = new PDFDocument({ margin: MARGIN, size: 'A4' })
  const chunks = []
  doc.on('data', c => chunks.push(c))
  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
  draw(doc)
  doc.end()
  return done
}

// En-tête commun : logo + coordonnées à gauche, type de document + numéro + date à droite.
function drawHeader(doc, label, number, date) {
  doc.font('Helvetica-Bold').fontSize(20)
    .fillColor(DARK).text('ECLIPSE ', MARGIN, 50, { continued: true })
    .fillColor(RED).text('AUTO')

  doc.font('Helvetica').fontSize(8).fillColor(GRAY)
    .text(COMPANY.address, MARGIN, 76)
    .text(`${COMPANY.phone}  —  ${COMPANY.email}`, MARGIN, 88)

  doc.font('Helvetica-Bold').fontSize(13).fillColor(RED)
    .text(label.toUpperCase(), MARGIN, 50, { align: 'right', width: WIDTH, characterSpacing: 1 })
  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
    .text(`N° ${number}`, MARGIN, 70, { align: 'right', width: WIDTH })
    .text(formatDate(date), MARGIN, 82, { align: 'right', width: WIDTH })

  doc.moveTo(MARGIN, 110).lineTo(MARGIN + WIDTH, 110).lineWidth(2).strokeColor(RED).stroke()
}

function drawClientAndVehicle(doc, y, clientName, vehicle) {
  doc.font('Helvetica').fontSize(9).fillColor(GRAY).text('CLIENT', MARGIN, y, { characterSpacing: 1 })
  doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK).text(clientName || 'Client', MARGIN, y + 13)

  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
    .text('VÉHICULE', MARGIN, y, { align: 'right', width: WIDTH, characterSpacing: 1 })
  doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK)
    .text(`${vehicle.brand} ${vehicle.model}`, MARGIN, y + 13, { align: 'right', width: WIDTH })

  const specs = [
    vehicle.year ? String(vehicle.year) : null,
    capitalize(vehicle.fuel_type),
    capitalize(vehicle.transmission),
  ].filter(Boolean).join(' · ')
  if (specs) {
    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text(specs, MARGIN, y + 30, { align: 'right', width: WIDTH })
  }

  return y + 55
}

function rule(doc, y) {
  doc.moveTo(MARGIN, y).lineTo(MARGIN + WIDTH, y).lineWidth(0.5).strokeColor(RULE).stroke()
}

// Table à deux colonnes (désignation / montant) : barre d'en-tête sombre, lignes séparées par
// un filet fin, total mis en évidence sur fond teinté. Pensée pour une facture, pas réutilisée
// telle quelle par la confirmation d'essai (qui n'a pas de montants).
function drawItemsTable(doc, y, rows, total) {
  doc.rect(MARGIN, y, WIDTH, 24).fill(DARK)
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8)
    .text('DÉSIGNATION', MARGIN + 12, y + 8, { characterSpacing: 0.5 })
    .text('MONTANT', MARGIN, y + 8, { align: 'right', width: WIDTH - 12, characterSpacing: 0.5 })
  y += 24

  for (const r of rows) {
    doc.font('Helvetica').fontSize(10).fillColor(DARK)
      .text(r.label, MARGIN + 12, y + 9, { width: WIDTH - 160 })
      .text(r.value, MARGIN, y + 9, { align: 'right', width: WIDTH - 12 })
    y += 28
    rule(doc, y)
  }

  doc.rect(MARGIN, y, WIDTH, 32).fill(RED_TINT)
  doc.font('Helvetica-Bold').fontSize(13).fillColor(RED)
    .text(total.label.toUpperCase(), MARGIN + 12, y + 9)
    .text(total.value, MARGIN, y + 9, { align: 'right', width: WIDTH - 12 })
  y += 32

  return y
}

// Une ligne label/valeur simple sur deux colonnes (confirmation d'essai : pas de tableau
// de prix, juste quelques informations factuelles).
function infoRow(doc, y, label, value) {
  doc.font('Helvetica').fontSize(10).fillColor(GRAY).text(label, MARGIN, y)
  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
    .text(value, MARGIN, y, { align: 'right', width: WIDTH })
  return y + 24
}

function drawFooter(doc, generatedAt) {
  const y = 760
  rule(doc, y)
  doc.font('Helvetica').fontSize(8).fillColor(GRAY)
    .text('Eclipse Auto — Projet éducatif, aucune transaction réelle.', MARGIN, y + 10, { align: 'center', width: WIDTH })
    .text(`Document généré automatiquement le ${formatDate(generatedAt)}.`, MARGIN, y + 22, { align: 'center', width: WIDTH })
}

// Facture jointe à l'email de confirmation d'achat (venteController.updateStatus).
function buildInvoicePdf({ id, date, clientName, vehicle, equipements = [], prixFinal, modePaiement }) {
  return render(doc => {
    const number = formatDocNumber('FACT', id, date)
    drawHeader(doc, 'Facture', number, date)

    let y = drawClientAndVehicle(doc, 140, clientName, vehicle)
    y += 15

    const rows = [
      { label: `${vehicle.brand} ${vehicle.model}`, value: formatPrice(vehicle.price) },
      ...equipements.map(eq => ({ label: `Option — ${eq.nom}`, value: `+ ${formatPrice(eq.prix_supplement)}` })),
    ]
    y = drawItemsTable(doc, y, rows, { label: 'Total TTC', value: formatPrice(prixFinal) })
    y += 20

    y = infoRow(doc, y, 'Mode de paiement', PAYMENT_METHOD_LABELS[modePaiement] || modePaiement)

    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text('Merci de votre confiance.', MARGIN, y + 10)

    drawFooter(doc, date)
  })
}

// Confirmation jointe à l'email de confirmation d'essai (reservationController.updateStatus).
// Pas de tableau de prix ici : l'essai ne porte pas de transaction, c'est le rôle de la
// facture de vente.
function buildReservationPdf({ id, date, clientName, vehicle, rdvDate, rdvDateFin }) {
  return render(doc => {
    const number = formatDocNumber('ESSAI', id, date)
    drawHeader(doc, "Confirmation d'essai", number, date)

    let y = drawClientAndVehicle(doc, 140, clientName, vehicle)
    y += 15
    rule(doc, y)
    y += 20

    if (rdvDate) {
      y = infoRow(doc, y, 'Rendez-vous', formatDate(rdvDate))
    }
    if (rdvDateFin && rdvDateFin !== rdvDate) {
      y = infoRow(doc, y, 'Retour prévu', formatDate(rdvDateFin))
    }
    if (vehicle.price) {
      y += 6
      rule(doc, y)
      y += 20
      y = infoRow(doc, y, 'Prix du véhicule', formatPrice(vehicle.price))
    }

    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text('Présentez-vous avec une pièce d\'identité et votre permis de conduire.', MARGIN, y + 10)

    drawFooter(doc, date)
  })
}

module.exports = { buildInvoicePdf, buildReservationPdf }
