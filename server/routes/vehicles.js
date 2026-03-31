const { Router } = require('express')
const supabase = require('../supabase')
const { requireAdmin } = require('../middleware/auth')

const router = Router()

// GET /api/vehicles — liste tous les véhicules
router.get('/', async (req, res) => {
  const { status, brand, fuel_type } = req.query

  let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (brand)    query = query.eq('brand', brand)
  if (fuel_type) query = query.eq('fuel_type', fuel_type)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/vehicles/:id — détail d'un véhicule
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Véhicule introuvable.' })
  res.json(data)
})

// POST /api/vehicles — créer un véhicule (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { brand, model, year, price, fuel_type, transmission, mileage, power, description, status } = req.body

  if (!brand || !model || !year || !price || !fuel_type || !transmission) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' })
  }

  const { data, error } = await supabase.from('vehicles').insert({
    brand, model,
    year: parseInt(year),
    price: parseFloat(price),
    fuel_type, transmission,
    mileage: mileage ? parseInt(mileage) : 0,
    power: power || null,
    description: description || null,
    status: status || 'available',
  }).select().single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/vehicles/:id — modifier un véhicule (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const { brand, model, year, price, fuel_type, transmission, mileage, power, description, status } = req.body

  const { data, error } = await supabase
    .from('vehicles')
    .update({
      brand, model,
      year: parseInt(year),
      price: parseFloat(price),
      fuel_type, transmission,
      mileage: mileage ? parseInt(mileage) : 0,
      power: power || null,
      description: description || null,
      status,
    })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/vehicles/:id — supprimer un véhicule (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('vehicles').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
