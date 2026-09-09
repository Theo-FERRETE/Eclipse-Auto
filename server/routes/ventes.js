// Tout est protégé : le client ne voit que les siennes, l'admin voit tout et confirme/annule.

const { Router } = require('express')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const venteController = require('../controllers/venteController')

const router = Router()

router.get('/', requireAuth, venteController.listMine)
router.get('/all', requireAdmin, venteController.listAll)
router.post('/', requireAuth, venteController.create)
router.patch('/:id/status', requireAdmin, venteController.updateStatus)

module.exports = router
