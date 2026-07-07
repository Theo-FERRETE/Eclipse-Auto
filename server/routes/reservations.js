const { Router } = require('express')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const reservationController = require('../controllers/reservationController')

const router = Router()

router.get('/', requireAuth, reservationController.listMine)
router.get('/all', requireAdmin, reservationController.listAll)
router.post('/', requireAuth, reservationController.create)
router.patch('/:id/status', requireAdmin, reservationController.updateStatus)
router.patch('/:id/cancel', requireAuth, reservationController.cancel)

module.exports = router
