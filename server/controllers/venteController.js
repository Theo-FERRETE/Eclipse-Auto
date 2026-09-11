// Logique des ventes. Règles importantes : le client_id vient du JWT, le prix final est
// toujours recalculé côté serveur (jamais confié au client), et un véhicule déjà vendu est
// refusé. La confirmation envoie l'email d'achat avec la facture PDF en pièce jointe ; le
// passage du véhicule en 'sold' est fait par le trigger PostgreSQL mark_vehicle_sold
// (migration 001), pas ici.

const nodemailer = require('nodemailer')
const venteModel = require('../models/venteModel')
const { buildVenteConfirmationEmail } = require('../lib/emailTemplates')
const { buildInvoicePdf } = require('../lib/pdf')
const { PAYMENT_METHODS } = require('../constants')

const VENTE_UPDATABLE_STATUSES = ['confirmed', 'cancelled']

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// Aplatit l'embed PostgREST : vente_equipements: [{ equipements }] -> equipements: []
function formatVenteEquipements(v) {
  const { vente_equipements, ...rest } = v
  return { ...rest, equipements: (vente_equipements || []).map(ve => ve.equipements) }
}

// Ajoute client_name à chaque vente. Sans clé étrangère vers profiles (même limitation que
// pour reservations), il faut une seconde requête groupée sur les client_id distincts.
async function withClientNames(ventes) {
  const ids = [...new Set(ventes.map(v => v.client_id).filter(Boolean))]
  if (ids.length === 0) return ventes

  const { data: profiles } = await venteModel.findProfilesByIds(ids)
  const byId = new Map((profiles || []).map(p => [p.id, p]))

  return ventes.map(v => {
    const p = byId.get(v.client_id)
    const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : ''
    return { ...v, client_name: name || 'Client inconnu' }
  })
}

// GET /api/ventes — ventes de l'utilisateur connecté
async function listMine(req, res) {
  const { data, error } = await venteModel.findByClient(req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data.map(formatVenteEquipements))
}

// GET /api/ventes/all — toutes les ventes (admin), paginées et filtrables par statut
async function listAll(req, res) {
  const { status, limit = 50, offset = 0 } = req.query

  const limitNum = Math.min(parseInt(limit) || 50, 100)
  const offsetNum = Math.max(parseInt(offset) || 0, 0)

  if (status && !['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' })
  }

  const { data, error, count } = await venteModel.findAll({ status, limit: limitNum, offset: offsetNum })
  if (error) return res.status(500).json({ error: error.message })

  const formatted = await withClientNames(data.map(formatVenteEquipements))
  res.json({ data: formatted, total: count, limit: limitNum, offset: offsetNum })
}

// POST /api/ventes — créer une vente
async function create(req, res) {
  const { vehicle_id, equipement_ids, mode_paiement, reservation_id } = req.body

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id obligatoire.' })
  }
  if (!PAYMENT_METHODS.includes(mode_paiement)) {
    return res.status(400).json({ error: `mode_paiement invalide (${PAYMENT_METHODS.join(', ')}).` })
  }

  // Revérifié ici et pas seulement côté React : la fiche peut être ouverte depuis longtemps.
  // 409 et non 400 : la requête est correcte, c'est l'état du véhicule qui a changé.
  const { data: vehicle } = await venteModel.findVehicleForSale(vehicle_id)

  if (!vehicle || vehicle.status === 'sold') {
    return res.status(409).json({ error: 'Ce véhicule a déjà été vendu.' })
  }

  // Le total n'est jamais lu depuis le corps de la requête : on ne fait confiance qu'aux
  // prix connus en base pour le véhicule et les équipements réellement demandés.
  let equipements = []
  if (Array.isArray(equipement_ids) && equipement_ids.length > 0) {
    const { data: foundEquipements, error: equipError } = await venteModel.findEquipementsByIds(equipement_ids)
    if (equipError) return res.status(500).json({ error: equipError.message })
    equipements = foundEquipements || []
  }

  const prixFinal = Number(vehicle.price) + equipements.reduce((sum, e) => sum + Number(e.prix_supplement), 0)

  const { data, error } = await venteModel.create({
    vehicle_id,
    // Le point de sécurité de cette route : client_id vient du token, jamais de req.body.
    client_id: req.user.id,
    reservation_id: reservation_id || null,
    prix_final: prixFinal,
    mode_paiement,
    // Imposé par le serveur : personne ne crée une vente déjà confirmée.
    status: 'pending',
  })

  if (error) return res.status(500).json({ error: error.message })

  // Liées après coup, puisqu'il faut l'id de la vente. Un échec est logué sans faire échouer
  // la requête. Sans transaction, on peut donc avoir une vente sans ses options.
  if (equipements.length > 0) {
    const { error: linkError } = await venteModel.linkEquipements(data.id, equipements.map(e => e.id))
    if (linkError) console.error('[Ventes] Erreur liaison équipements :', linkError)
  }

  res.status(201).json({ ...data, equipements })
}

// PATCH /api/ventes/:id/status — confirmer ou annuler une vente (admin)
// Le trigger PostgreSQL mark_vehicle_sold met à jour vehicles.status automatiquement.
async function updateStatus(req, res) {
  const { status } = req.body

  if (!VENTE_UPDATABLE_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Statut invalide (${VENTE_UPDATABLE_STATUSES.join(', ')}).` })
  }

  // Lu avant la mise à jour : ça vérifie que la vente existe et ça récupère au passage les
  // données de l'email.
  const { data: venteData } = await venteModel.findWithDetailsForEmail(req.params.id)

  if (!venteData) return res.status(404).json({ error: 'Vente introuvable.' })

  const { data, error } = await venteModel.updateStatus(req.params.id, status)

  if (error) {
    // 23505 = unique_violation : l'index one_confirmed_sale refuse une deuxième vente
    // confirmée pour le même véhicule (migration 001).
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ce véhicule a déjà une vente confirmée.' })
    }
    return res.status(500).json({ error: error.message })
  }

  // Email seulement à la confirmation.
  if (status === 'confirmed') {
    try {
      // L'email est dans auth.users, le prénom dans profiles : deux requêtes, en parallèle.
      const [{ data: { user: clientUser } }, { data: profile }] = await venteModel.getAuthUserAndProfile(venteData.client_id)

      if (clientUser?.email) {
        const firstName = profile?.first_name || 'Client'
        const equipements = (venteData.vente_equipements || []).map(ve => ve.equipements)
        const invoice = await buildInvoicePdf({
          id: req.params.id,
          date: new Date(),
          clientName: firstName,
          vehicle: venteData.vehicles,
          equipements,
          prixFinal: venteData.prix_final,
          modePaiement: venteData.mode_paiement,
        })
        await transporter.sendMail({
          from: `"Eclipse Auto" <${process.env.GMAIL_USER}>`,
          to: clientUser.email,
          subject: `Votre achat est confirmé — ${venteData.vehicles.brand} ${venteData.vehicles.model}`,
          html: buildVenteConfirmationEmail(firstName, venteData.vehicles, equipements, venteData.prix_final, venteData.mode_paiement),
          attachments: [{ filename: `facture-${req.params.id.slice(0, 8)}.pdf`, content: invoice }],
        })
      }
    } catch (emailErr) {
      // Volontairement sans interrompre la requête : si Gmail tombe, la vente reste
      // confirmée. L'email est une notification, pas une opération métier.
      console.error('[Ventes] Erreur envoi email :', emailErr)
    }
  }

  res.json(data)
}

module.exports = { listMine, listAll, create, updateStatus }
