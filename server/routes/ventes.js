// Tout est protégé : le client ne voit que les siennes et ne peut annuler qu'un achat encore
// en attente ; l'admin voit tout et confirme/annule à n'importe quel statut.

const { Router } = require('express')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const venteController = require('../controllers/venteController')

const router = Router()

router.get('/', requireAuth, venteController.listMine)
router.get('/all', requireAdmin, venteController.listAll)
router.post('/', requireAuth, venteController.create)
router.patch('/:id/status', requireAdmin, venteController.updateStatus)
router.patch('/:id/cancel', requireAuth, venteController.cancel)

module.exports = router
