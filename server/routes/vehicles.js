// Véhicules : lecture publique, écritures réservées aux admins.

const { Router } = require('express')
const { requireAdmin } = require('../middleware/auth')
const vehicleController = require('../controllers/vehicleController')

const router = Router()

router.get('/', vehicleController.list)
router.get('/by-slug/:slug', vehicleController.getBySlug)
router.get('/:id', vehicleController.getById)
router.post('/', requireAdmin, vehicleController.create)
router.put('/:id', requireAdmin, vehicleController.update)
router.delete('/:id', requireAdmin, vehicleController.remove)

module.exports = router
