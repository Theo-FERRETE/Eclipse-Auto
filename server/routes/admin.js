const { Router } = require('express')
const supabase = require('../supabase')
const { requireAdmin } = require('../middleware/auth')

const router = Router()

// GET /api/admin/stats — statistiques du dashboard
router.get('/stats', requireAdmin, async (req, res) => {
  const [
    { count: totalVehicles },
    { count: available },
    { count: reserved },
    { count: sold },
    { count: totalReservations },
    { count: pending },
    { count: confirmed },
    { count: clients },
  ] = await Promise.all([
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'reserved'),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
  ])

  res.json({
    vehicles: { total: totalVehicles, available, reserved, sold },
    reservations: { total: totalReservations, pending, confirmed },
    clients,
  })
})

// GET /api/admin/clients — liste des clients
router.get('/clients', requireAdmin, async (req, res) => {
  const { limit = 50, offset = 0 } = req.query

  const limitNum = Math.min(parseInt(limit) || 50, 100)
  const offsetNum = Math.max(parseInt(offset) || 0, 0)

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .range(offsetNum, offsetNum + limitNum - 1)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, total: count, limit: limitNum, offset: offsetNum })
})

// DELETE /api/admin/clients/:id — supprimer un client
router.delete('/clients/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('profiles').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
