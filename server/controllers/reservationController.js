// Logique des réservations. Trois règles importantes : le client_id vient du JWT, on ne peut
// annuler que la sienne, et un véhicule déjà pris est refusé. Envoie aussi l'email de
// confirmation.

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

// Aplatit l'embed PostgREST : reservation_equipements: [{ equipements }] -> equipements: []
function formatReservationEquipements(r) {
  const { reservation_equipements, ...rest } = r
  return { ...rest, equipements: (reservation_equipements || []).map(re => re.equipements) }
}

// GET /api/reservations — réservations de l'utilisateur connecté
// Filtre sur req.user.id, issu du token : impossible de demander celles d'un autre client.
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

  const formatted = await withClientNames(data.map(formatReservationEquipements))
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

// POST /api/reservations — créer une réservation
async function create(req, res) {
  const { vehicle_id, message, rdv_date, equipement_ids } = req.body

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id obligatoire.' })
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
    rdv_date: rdv_date || null,
  })

  if (error) return res.status(500).json({ error: error.message })

  // Liés après coup, puisqu'il faut l'id de la réservation. Un échec est logué sans faire
  // échouer la requête. Sans transaction, on peut donc avoir une réservation sans ses options.
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

  // Liste blanche : on n'écrit que des valeurs connues.
  if (!RESERVATION_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' })
  }

  // Lu avant la mise à jour : ça vérifie que la réservation existe et ça récupère au passage
  // les données de l'email.
  const { data: resData } = await reservationModel.findWithVehicleForEmail(req.params.id)

  if (!resData) return res.status(404).json({ error: 'Réservation introuvable.' })

  const { data, error } = await reservationModel.updateStatus(req.params.id, status)

  if (error) return res.status(500).json({ error: error.message })

  // Email seulement à la confirmation.
  if (status === 'confirmed') {
    try {
      // L'email est dans auth.users, le prénom dans profiles : deux requêtes, en parallèle.
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
