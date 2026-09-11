// PDF joints aux emails de confirmation : facture d'achat, confirmation d'essai. Document
// imprimable (fond blanc) : contrairement aux emails (lus à l'écran), une facture qu'on
// imprime ne doit pas gâcher d'encre avec un fond sombre.

const PDFDocument = require('pdfkit')
const { PAYMENT_METHOD_LABELS } = require('./emailTemplates')

const RED = '#e8000d'
const DARK = '#161616'
const GRAY = '#767676'
const RULE = '#e2e2e2'
const MARGIN = 50
const WIDTH = 495 // largeur utile A4 (595 - 2 * MARGIN)

function formatPrice(n) {
  return `${Number(n).toLocaleString('fr-FR')} €`
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
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

function drawHeader(doc, label, number, date) {
  doc.font('Helvetica-Bold').fontSize(20)
    .fillColor(DARK).text('ECLIPSE ', MARGIN, 50, { continued: true })
    .fillColor(RED).text('AUTO')

  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
    .text(`N° ${number}`, MARGIN, 52, { align: 'right', width: WIDTH })
    .text(formatDate(date), MARGIN, 65, { align: 'right', width: WIDTH })

  doc.moveTo(MARGIN, 85).lineTo(MARGIN + WIDTH, 85).lineWidth(2).strokeColor(RED).stroke()

  doc.font('Helvetica-Bold').fontSize(11).fillColor(RED)
    .text(label.toUpperCase(), MARGIN, 100, { characterSpacing: 1 })
}

function drawVehicle(doc, y, vehicle) {
  doc.font('Helvetica-Bold').fontSize(14).fillColor(DARK)
    .text(`${vehicle.brand} ${vehicle.model}`, MARGIN, y)
  doc.font('Helvetica').fontSize(10).fillColor(GRAY)
    .text(String(vehicle.year || ''), MARGIN, y + 18)
}

// Une ligne label/valeur sur deux colonnes : label à gauche, valeur alignée à droite.
function row(doc, y, label, value, opts = {}) {
  doc.font('Helvetica').fontSize(10).fillColor(GRAY).text(label, MARGIN, y)
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || 10)
    .fillColor(opts.color || DARK).text(value, MARGIN, y, { align: 'right', width: WIDTH })
}

function rule(doc, y) {
  doc.moveTo(MARGIN, y).lineTo(MARGIN + WIDTH, y).lineWidth(0.5).strokeColor(RULE).stroke()
}

function drawFooter(doc) {
  doc.font('Helvetica').fontSize(8).fillColor(GRAY)
    .text('Eclipse Auto — Projet éducatif, aucune transaction réelle.', MARGIN, 760, { align: 'center', width: WIDTH })
}

// Facture jointe à l'email de confirmation d'achat (venteController.updateStatus).
function buildInvoicePdf({ id, date, clientName, vehicle, equipements = [], prixFinal, modePaiement }) {
  return render(doc => {
    drawHeader(doc, 'Facture', id.slice(0, 8).toUpperCase(), date)

    let y = 140
    row(doc, y, 'Client', clientName || 'Client')
    y += 35

    drawVehicle(doc, y, vehicle)
    y += 50

    rule(doc, y)
    y += 15

    row(doc, y, `${vehicle.brand} ${vehicle.model}`, formatPrice(vehicle.price))
    y += 20

    for (const eq of equipements) {
      row(doc, y, eq.nom, `+ ${formatPrice(eq.prix_supplement)}`)
      y += 20
    }

    rule(doc, y)
    y += 15
    row(doc, y, 'Total', formatPrice(prixFinal), { bold: true, size: 13 })
    y += 28
    row(doc, y, 'Mode de paiement', PAYMENT_METHOD_LABELS[modePaiement] || modePaiement)

    drawFooter(doc)
  })
}

// Confirmation jointe à l'email de confirmation d'essai (reservationController.updateStatus).
// Pas de prix ici : l'essai ne porte pas de transaction, c'est le rôle de la facture de vente.
function buildReservationPdf({ id, date, clientName, vehicle, rdvDate, rdvDateFin }) {
  return render(doc => {
    drawHeader(doc, "Confirmation d'essai", id.slice(0, 8).toUpperCase(), date)

    let y = 140
    row(doc, y, 'Client', clientName || 'Client')
    y += 35

    drawVehicle(doc, y, vehicle)
    y += 50

    rule(doc, y)
    y += 15

    if (rdvDate) {
      row(doc, y, 'Rendez-vous', formatDate(rdvDate))
      y += 20
    }
    if (rdvDateFin && rdvDateFin !== rdvDate) {
      row(doc, y, 'Retour prévu', formatDate(rdvDateFin))
      y += 20
    }

    drawFooter(doc)
  })
}

module.exports = { buildInvoicePdf, buildReservationPdf }
