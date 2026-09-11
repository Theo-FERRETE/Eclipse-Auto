// Logique des essais (réservations d'un créneau). Trois règles importantes : le client_id
// vient du JWT, on ne peut annuler que le sien, et un véhicule déjà pris est refusé. Envoie
// aussi l'email de confirmation, avec un PDF récapitulatif en pièce jointe. Aucune notion de
// prix ni d'équipements ici : c'est le rôle de venteController.

const nodemailer = require('nodemailer')
const reservationModel = require('../models/reservationModel')
const { buildConfirmationEmail } = require('../lib/emailTemplates')
const { buildReservationPdf } = require('../lib/pdf')
const { RESERVATION_STATUSES } = require('../constants')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// GET /api/reservations — réservations de l'utilisateur connecté
// Filtre sur req.user.id, issu du token : impossible de demander celles d'un autre client.
async function listMine(req, res) {
  const { data, error } = await reservationModel.findByClient(req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// GET /api/reservations/all — toutes les réservations (admin)
async function listAll(req, res) {
  const { status, limit = 50, offset = 0 } = req.query

  const limitNum = Math.min(parseInt(limit) || 50, 100)
  const offsetNum = Math.max(parseInt(offset) || 0, 0)

  if (status && !RESERVATION_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' })
  }

  const { data, error, count } = await reservationModel.findAll({ status, limit: limitNum, offset: offsetNum })
  if (error) return res.status(500).json({ error: error.message })

  const formatted = await withClientNames(data)
  res.json({ data: formatted, total: count, limit: limitNum, offset: offsetNum })
}

// Ajoute client_name à chaque réservation. Sans clé étrangère vers profiles,
// il faut une seconde requête groupée sur les client_id distincts.
async function withClientNames(reservations) {
  const ids = [...new Set(reservations.map(r => r.client_id).filter(Boolean))]
  if (ids.length === 0) return reservations

  const { data: profiles } = await reservationModel.findProfilesByIds(ids)
  const byId = new Map((profiles || []).map(p => [p.id, p]))

  return reservations.map(r => {
    const p = byId.get(r.client_id)
    const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : ''
    return { ...r, client_name: name || 'Client inconnu' }
  })
}

// POST /api/reservations — créer une réservation (essai)
async function create(req, res) {
  const { vehicle_id, message, rdv_date, rdv_date_fin } = req.body

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id obligatoire.' })
  }

  // La période de l'essai (rdv_date -> rdv_date_fin) est ce qui permet la
  // remise en disponible automatique du véhicule (voir server/jobs/
  // expireReservations.js) : sans les deux bornes, rien à surveiller.
  if (!rdv_date || !rdv_date_fin) {
    return res.status(400).json({ error: 'Dates de début et de fin d\'essai obligatoires.' })
  }
  if (new Date(rdv_date_fin) < new Date(rdv_date)) {
    return res.status(400).json({ error: 'La date de fin doit être postérieure à la date de début.' })
  }

  // Revérifié ici et pas seulement côté React : la page peut être ouverte depuis dix minutes.
  // 409 et non 400 : la requête est correcte, c'est l'état du véhicule qui a changé.
  const { data: vehicle } = await reservationModel.findVehicleStatus(vehicle_id)

  if (!vehicle || vehicle.status !== 'available') {
    return res.status(409).json({ error: 'Ce véhicule n\'est plus disponible.' })
  }

  const { data, error } = await reservationModel.create({
    vehicle_id,
    // Le point de sécurité de cette route : client_id vient du token, jamais de req.body.
    client_id: req.user.id,
    // Imposé par le serveur : personne ne crée une réservation déjà confirmée.
    status: 'pending',
    message: message || null,
    rdv_date,
    rdv_date_fin,
  })

  if (error) {
    // 23P01 = exclusion_violation : la contrainte reservations_no_double_slot a refusé
    // deux essais confirmés sur le même véhicule au même créneau (voir migration 001).
    if (error.code === '23P01') {
      return res.status(409).json({ error: 'Ce créneau est déjà réservé pour ce véhicule.' })
    }
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json(data)
}

// PATCH /api/reservations/:id/status — changer le statut (admin)
// Le trigger PostgreSQL met à jour vehicles.status automatiquement
async function updateStatus(req, res) {
  const { status } = req.body

  // Liste blanche : on n'écrit que des valeurs connues.
  if (!RESERVATION_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' })
  }

  // Lu avant la mise à jour : ça vérifie que la réservation existe et ça récupère au passage
  // les données de l'email.
  const { data: resData } = await reservationModel.findWithVehicleForEmail(req.params.id)

  if (!resData) return res.status(404).json({ error: 'Réservation introuvable.' })

  const { data, error } = await reservationModel.updateStatus(req.params.id, status)

  if (error) {
    // 23P01 = exclusion_violation : un autre essai est déjà confirmé sur ce véhicule à ce
    // créneau (contrainte reservations_no_double_slot, voir migration 001). C'est ici, à la
    // confirmation, que la contrainte peut réellement se déclencher (la création reste en
    // 'pending', hors du périmètre de la contrainte).
    if (error.code === '23P01') {
      return res.status(409).json({ error: 'Ce créneau est déjà réservé pour ce véhicule.' })
    }
    return res.status(500).json({ error: error.message })
  }

  // Email seulement à la confirmation.
  if (status === 'confirmed') {
    try {
      // L'email est dans auth.users, le prénom dans profiles : deux requêtes, en parallèle.
      const [{ data: { user: clientUser } }, { data: profile }] = await reservationModel.getAuthUserAndProfile(resData.client_id)

      if (clientUser?.email) {
        const firstName = profile?.first_name || 'Client'
        const confirmation = await buildReservationPdf({
          id: req.params.id,
          date: new Date(),
          clientName: firstName,
          vehicle: resData.vehicles,
          rdvDate: resData.rdv_date,
          rdvDateFin: resData.rdv_date_fin,
        })
        await transporter.sendMail({
          from: `"Eclipse Auto" <${process.env.GMAIL_USER}>`,
          to: clientUser.email,
          subject: `Votre réservation est confirmée — ${resData.vehicles.brand} ${resData.vehicles.model}`,
          html: buildConfirmationEmail(firstName, resData.vehicles, resData.rdv_date, resData.rdv_date_fin),
          attachments: [{ filename: `confirmation-essai-${req.params.id.slice(0, 8)}.pdf`, content: confirmation }],
        })
      }
    } catch (emailErr) {
      // Volontairement sans interrompre la requête : si Gmail tombe, la réservation reste
      // confirmée. L'email est une notification, pas une opération métier.
      console.error('[Reservations] Erreur envoi email :', emailErr)
    }
  }

  res.json(data)
}

// PATCH /api/reservations/:id/cancel — annulation par le client
async function cancel(req, res) {
  const { data: reservation } = await reservationModel.findClientAndStatus(req.params.id)

  // Existe / m'appartient / est annulable. Sans le test du milieu, n'importe qui pourrait
  // annuler la réservation d'un autre : être connecté ne suffit pas.
  if (!reservation) return res.status(404).json({ error: 'Réservation introuvable.' })
  if (reservation.client_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' })
  if (!['pending', 'confirmed'].includes(reservation.status)) {
    return res.status(400).json({ error: 'Seules les réservations en attente ou confirmées peuvent être annulées.' })
  }

  const { data, error } = await reservationModel.cancel(req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

module.exports = { listMine, listAll, create, updateStatus, cancel }
