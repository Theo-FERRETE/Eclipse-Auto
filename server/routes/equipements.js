const { Router } = require('express')
const supabase = require('../supabase')

const router = Router()

// GET /api/equipements — liste tous les équipements disponibles
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('equipements')
    .select('*')
    .order('categorie')
    .order('nom')

  if (error) { console.error('[DEBUG equipements]', error); return res.status(500).json({ error: error.message }) }
  res.json(data)
})

module.exports = router
