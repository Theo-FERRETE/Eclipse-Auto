const { Router } = require('express')

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Eclipse Auto API', timestamp: new Date().toISOString() })
})

module.exports = router
