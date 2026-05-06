const { Router } = require('express')

const vehiclesRouter     = require('./vehicles')
const reservationsRouter = require('./reservations')
const adminRouter        = require('./admin')
const contactRouter      = require('./contact')
const healthRouter       = require('./health')

const router = Router()

router.use('/vehicles',     vehiclesRouter)
router.use('/reservations', reservationsRouter)
router.use('/admin',        adminRouter)
router.use('/contact',      contactRouter)
router.use('/',             healthRouter)

module.exports = router
