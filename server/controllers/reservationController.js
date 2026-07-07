const nodemailer = require('nodemailer')
const reservationModel = require('../models/reservationModel')
const { buildConfirmationEmail } = require('../lib/emailTemplates')
const { RESERVATION_STATUSES } = require('../constants')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function formatReservationEquipements(r) {
  const { reservation_equipements, ...rest } = r
  return { ...rest, equipements: (reservation_equipements || []).map(re => re.equipements) }
}

// GET /api/reservations — réservations de l'utilisateur connecté
async function listMine(req, res) {
  const { data, error } = await reservationModel.findByClient(req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data.map(formatReservationEquipements))
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
  res.json({ data: data.map(formatReservationEquipements), total: count, limit: limitNum, offset: offsetNum })
}

// POST /api/reservations — créer une réservation
async function create(req, res) {
  const { vehicle_id, message, rdv_date, equipement_ids } = req.body

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id obligatoire.' })
  }

  const { data: vehicle } = await reservationModel.findVehicleStatus(vehicle_id)

  if (!vehicle || vehicle.status !== 'available') {
    return res.status(409).json({ error: 'Ce véhicule n\'est plus disponible.' })
  }

  const { data, error } = await reservationModel.create({
    vehicle_id,
    client_id: req.user.id,
    status: 'pending',
    message: message || null,
    rdv_date: rdv_date || null,
  })

  if (error) return res.status(500).json({ error: error.message })

  if (Array.isArray(equipement_ids) && equipement_ids.length > 0) {
    const { error: equipError } = await reservationModel.linkEquipements(data.id, equipement_ids)
    if (equipError) console.error('[Reservations] Erreur liaison équipements :', equipError)
  }

  res.status(201).json(data)
}

// PATCH /api/reservations/:id/status — changer le statut (admin)
// Le trigger PostgreSQL met à jour vehicles.status automatiquement
async function updateStatus(req, res) {
  const { status } = req.body

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' })
  }

  const { data: resData } = await reservationModel.findWithVehicleForEmail(req.params.id)

  const { data, error } = await reservationModel.updateStatus(req.params.id, status)

  if (error) return res.status(500).json({ error: error.message })

  if (status === 'confirmed' && resData) {
    try {
      const [{ data: { user: clientUser } }, { data: profile }] = await reservationModel.getAuthUserAndProfile(resData.client_id)

      if (clientUser?.email) {
        const firstName = profile?.first_name || 'Client'
        await transporter.sendMail({
          from: `"Eclipse Auto" <${process.env.GMAIL_USER}>`,
          to: clientUser.email,
          subject: `Votre réservation est confirmée — ${resData.vehicles.brand} ${resData.vehicles.model}`,
          html: buildConfirmationEmail(firstName, resData.vehicles, resData.rdv_date),
        })
      }
    } catch (emailErr) {
      console.error('[Reservations] Erreur envoi email :', emailErr)
    }
  }

  res.json(data)
}

// PATCH /api/reservations/:id/cancel — annulation par le client
async function cancel(req, res) {
  const { data: reservation } = await reservationModel.findClientAndStatus(req.params.id)

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
