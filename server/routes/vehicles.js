const { Router } = require('express')
const supabase = require('../supabase')
const { requireAdmin } = require('../middleware/auth')

const router = Router()

function validateVehicleInput(body) {
  const { year, price, mileage } = body
  const currentYear = new Date().getFullYear()

  if (year) {
    const y = parseInt(year)
    if (isNaN(y) || y < 1900 || y > currentYear + 1) {
      return 'Année invalide (1900 - ' + (currentYear + 1) + ').'
    }
  }

  if (price) {
    const p = parseFloat(price)
    if (isNaN(p) || p < 0) {
      return 'Prix invalide (doit être >= 0).'
    }
  }

  if (mileage) {
    const m = parseInt(mileage)
    if (isNaN(m) || m < 0) {
      return 'Kilométrage invalide (doit être >= 0).'
    }
  }

  return null
}

// GET /api/vehicles — liste tous les véhicules
router.get('/', async (req, res) => {
  const { status, brand, fuel_type, limit = 50, offset = 0 } = req.query

  let query = supabase.from('vehicles').select('*', { count: 'exact' }).order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (brand)    query = query.eq('brand', brand)
  if (fuel_type) query = query.eq('fuel_type', fuel_type)

  const limitNum = Math.min(parseInt(limit) || 50, 100)
  const offsetNum = Math.max(parseInt(offset) || 0, 0)

  const { data, error, count } = await query.range(offsetNum, offsetNum + limitNum - 1)
  if (error) return res.status(500).json({ error: error.message })

  res.json({ data, total: count, limit: limitNum, offset: offsetNum })
})

// GET /api/vehicles/by-slug/:slug — détail par slug (brand-model)
router.get('/by-slug/:slug', async (req, res) => {
  const slug = req.params.slug.toLowerCase()

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const vehicle = vehicles?.find(v => {
    const vehicleSlug = `${v.brand}-${v.model}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return vehicleSlug === slug
  })

  if (!vehicle) return res.status(404).json({ error: 'Véhicule introuvable.' })
  res.json(vehicle)
})

// GET /api/vehicles/:id — détail par UUID
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

  const validationError = validateVehicleInput({ year, price, mileage })
  if (validationError) return res.status(400).json({ error: validationError })

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

  const validationError = validateVehicleInput({ year, price, mileage })
  if (validationError) return res.status(400).json({ error: validationError })

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
