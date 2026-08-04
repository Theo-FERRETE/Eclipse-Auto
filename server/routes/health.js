// Répond 200 si l'API est debout. Sert à la CI et aux déploiements.

const { Router } = require('express')

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Eclipse Auto API', timestamp: new Date().toISOString() })
})

module.exports = router
