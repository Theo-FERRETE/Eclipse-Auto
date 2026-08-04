// CRUD des équipements. Validation partagée entre create et update.

const equipementModel = require('../models/equipementModel')

function validateEquipementInput(body) {
  const { nom, prix_supplement } = body

  if (!nom || !nom.trim()) {
    return 'Le nom est obligatoire.'
  }

  if (prix_supplement !== undefined) {
    const p = parseFloat(prix_supplement)
    if (isNaN(p) || p < 0) {
      return 'Prix invalide (doit être >= 0).'
    }
  }

  return null
}

// GET /api/equipements — liste tous les équipements disponibles
async function list(req, res) {
  const { data, error } = await equipementModel.findAll()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// POST /api/equipements — créer un équipement (admin)
async function create(req, res) {
  const { nom, categorie, prix_supplement } = req.body

  const validationError = validateEquipementInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { data, error } = await equipementModel.create({
    nom: nom.trim(),
    categorie: categorie || null,
    prix_supplement: prix_supplement ? parseFloat(prix_supplement) : 0,
  })

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

// PUT /api/equipements/:id — modifier un équipement (admin)
async function update(req, res) {
  const { nom, categorie, prix_supplement } = req.body

  const validationError = validateEquipementInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { data, error } = await equipementModel.update(req.params.id, {
    nom: nom.trim(),
    categorie: categorie || null,
    prix_supplement: prix_supplement ? parseFloat(prix_supplement) : 0,
  })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// DELETE /api/equipements/:id — supprimer un équipement (admin)
async function remove(req, res) {
  const { error } = await equipementModel.remove(req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}

module.exports = { list, create, update, remove }
