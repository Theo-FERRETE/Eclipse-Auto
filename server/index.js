require('dotenv').config()
const express = require('express')
const path = require('path')
const setupMiddleware = require('./middleware/setup')
const apiRouter = require('./routes/api')

const app = express()
const PORT = process.env.PORT || 3001

setupMiddleware(app)

// Routes API
app.use('/api', apiRouter)

// Frontend statique (production)
const distPath = path.join(__dirname, '../client/dist')
app.use(express.static(distPath))
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// Erreur globale
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Erreur interne du serveur.' })
})

app.listen(PORT, () => {
  console.log(`Eclipse Auto — http://localhost:${PORT}`)
})
