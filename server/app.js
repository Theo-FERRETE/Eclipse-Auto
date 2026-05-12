require('dotenv').config()
const express = require('express')
const path = require('path')
const setupMiddleware = require('./middleware/setup')
const apiRouter = require('./routes/api')

const app = express()

app.set('trust proxy', 1)
setupMiddleware(app)

app.use('/api', apiRouter)

// Frontend statique (production)
const distPath = path.join(__dirname, '../client/dist')
app.use(express.static(distPath, {
  maxAge: '1y',
  etag: false,
}))
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// Erreur globale
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production'
  const message = isDev ? err.message : 'Erreur interne du serveur.'
  if (isDev) console.error(err)
  res.status(err.status || 500).json({ error: message })
})

module.exports = app
