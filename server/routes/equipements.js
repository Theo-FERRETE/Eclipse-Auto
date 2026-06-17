const { Router } = require('express')
const supabase = require('../supabase')
const { requireAdmin } = require('../middleware/auth')

const router = Router()

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
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('equipements')
    .select('*')
    .order('categorie')
    .order('nom')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/equipements — créer un équipement (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { nom, categorie, prix_supplement } = req.body

  const validationError = validateEquipementInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { data, error } = await supabase.from('equipements').insert({
    nom: nom.trim(),
    categorie: categorie || null,
    prix_supplement: prix_supplement ? parseFloat(prix_supplement) : 0,
  }).select().single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/equipements/:id — modifier un équipement (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const { nom, categorie, prix_supplement } = req.body

  const validationError = validateEquipementInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { data, error } = await supabase
    .from('equipements')
    .update({
      nom: nom.trim(),
      categorie: categorie || null,
      prix_supplement: prix_supplement ? parseFloat(prix_supplement) : 0,
    })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/equipements/:id — supprimer un équipement (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('equipements').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
