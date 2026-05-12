const { Router } = require('express')
const supabase = require('../supabase')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = Router()

// GET /api/reservations — réservations de l'utilisateur connecté
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, vehicles(brand, model, images, price)')
    .eq('client_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/reservations/all — toutes les réservations (admin)
router.get('/all', requireAdmin, async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query

  const limitNum = Math.min(parseInt(limit) || 50, 100)
  const offsetNum = Math.max(parseInt(offset) || 0, 0)

  let query = supabase
    .from('reservations')
    .select('*, vehicles(brand, model, images, price)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query.range(offsetNum, offsetNum + limitNum - 1)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, total: count, limit: limitNum, offset: offsetNum })
})

// POST /api/reservations — créer une réservation
router.post('/', requireAuth, async (req, res) => {
  const { vehicle_id, message, rdv_date } = req.body

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id obligatoire.' })
  }

  // Vérifier que le véhicule est disponible
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('status')
    .eq('id', vehicle_id)
    .single()

  if (!vehicle || vehicle.status !== 'available') {
    return res.status(409).json({ error: 'Ce véhicule n\'est plus disponible.' })
  }

  const { data, error } = await supabase.from('reservations').insert({
    vehicle_id,
    client_id: req.user.id,
    status: 'pending',
    message: message || null,
    rdv_date: rdv_date || null,
  }).select().single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PATCH /api/reservations/:id/status — changer le statut (admin)
// Le trigger PostgreSQL met à jour vehicles.status automatiquement
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' })
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PATCH /api/reservations/:id/cancel — annulation par le client
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  // Vérifier que la réservation appartient bien à cet utilisateur
  const { data: reservation } = await supabase
    .from('reservations')
    .select('client_id, status')
    .eq('id', req.params.id)
    .single()

  if (!reservation) return res.status(404).json({ error: 'Réservation introuvable.' })
  if (reservation.client_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' })
  if (reservation.status !== 'pending') return res.status(400).json({ error: 'Seules les réservations en attente peuvent être annulées.' })

  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
