const { Router } = require('express')
const { requireAdmin } = require('../middleware/auth')
const adminController = require('../controllers/adminController')

const router = Router()

router.get('/stats', requireAdmin, adminController.stats)
router.get('/clients', requireAdmin, adminController.listClients)
router.delete('/clients/:id', requireAdmin, adminController.deleteClient)

module.exports = router
