const vehicleModel = require('../models/vehicleModel')
const { VEHICLE_STATUSES } = require('../constants')

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

  if (body.status !== undefined && !VEHICLE_STATUSES.includes(body.status)) {
    return `Statut invalide (${VEHICLE_STATUSES.join(', ')}).`
  }

  return null
}

// Champs modifiables et conversion associée. Sert à ne construire le payload
// qu'avec les champs réellement envoyés : un PUT partiel ne doit pas écraser
// les autres colonnes (parseInt(undefined) donnerait NaN, sérialisé en null).
const VEHICLE_FIELDS = {
  brand:        v => v,
  model:        v => v,
  year:         v => parseInt(v),
  price:        v => parseFloat(v),
  fuel_type:    v => v,
  transmission: v => v,
  mileage:      v => (v === '' || v === null ? 0 : parseInt(v)),
  power:        v => v || null,
  description:  v => v || null,
  status:       v => v,
  images:       v => v || [],
}

function buildVehiclePayload(body) {
  const payload = {}
  for (const [field, cast] of Object.entries(VEHICLE_FIELDS)) {
    if (body[field] !== undefined) payload[field] = cast(body[field])
  }
  return payload
}

// GET /api/vehicles — liste tous les véhicules
async function list(req, res) {
  const { status, brand, fuel_type, limit = 50, offset = 0 } = req.query

  if (status && !VEHICLE_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' })
  }

  const limitNum = Math.min(parseInt(limit) || 50, 100)
  const offsetNum = Math.max(parseInt(offset) || 0, 0)

  const { data, error, count } = await vehicleModel.findAll({ status, brand, fuel_type, limit: limitNum, offset: offsetNum })
  if (error) return res.status(500).json({ error: error.message })

  res.json({ data, total: count, limit: limitNum, offset: offsetNum })
}

// GET /api/vehicles/by-slug/:slug — détail par slug (brand-model)
async function getBySlug(req, res) {
  const slug = req.params.slug.toLowerCase()

  const { data: vehicles, error } = await vehicleModel.findAllOrderedByDate()
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
}

// GET /api/vehicles/:id — détail par UUID
async function getById(req, res) {
  const { data, error } = await vehicleModel.findById(req.params.id)
  if (error) return res.status(404).json({ error: 'Véhicule introuvable.' })
  res.json(data)
}

// POST /api/vehicles — créer un véhicule (admin)
async function create(req, res) {
  const { brand, model, year, price, fuel_type, transmission } = req.body

  if (!brand || !model || !year || !price || !fuel_type || !transmission) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' })
  }

  const validationError = validateVehicleInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { data, error } = await vehicleModel.create({
    mileage: 0,
    status: 'available',
    images: [],
    ...buildVehiclePayload(req.body),
  })

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

// PUT /api/vehicles/:id — modifier un véhicule (admin)
// Mise à jour partielle : seuls les champs présents dans le corps sont écrits.
async function update(req, res) {
  const validationError = validateVehicleInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const payload = buildVehiclePayload(req.body)

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Aucun champ à modifier.' })
  }

  const { data, error } = await vehicleModel.update(req.params.id, payload)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// DELETE /api/vehicles/:id — supprimer un véhicule (admin)
async function remove(req, res) {
  const { error } = await vehicleModel.remove(req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}

module.exports = { list, getBySlug, getById, create, update, remove }
