const { Router } = require('express')
const { requireAdmin } = require('../middleware/auth')
const equipementController = require('../controllers/equipementController')

const router = Router()

router.get('/', equipementController.list)
router.post('/', requireAdmin, equipementController.create)
router.put('/:id', requireAdmin, equipementController.update)
router.delete('/:id', requireAdmin, equipementController.remove)

module.exports = router
