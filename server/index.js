require('dotenv').config()
const express = require('express')
const cors = require('cors')

const vehiclesRouter     = require('./routes/vehicles')
const reservationsRouter = require('./routes/reservations')
const adminRouter        = require('./routes/admin')
const contactRouter      = require('./routes/contact')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/vehicles',     vehiclesRouter)
app.use('/api/reservations', reservationsRouter)
app.use('/api/admin',        adminRouter)
app.use('/api/contact',      contactRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Eclipse Auto API', timestamp: new Date().toISOString() })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable.` })
})

// Erreur globale
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Erreur interne du serveur.' })
})

app.listen(PORT, () => {
  console.log(`Eclipse Auto API — http://localhost:${PORT}`)
})
