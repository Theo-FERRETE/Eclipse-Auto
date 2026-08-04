// Configuration de l'app Express : sécurité, middlewares, routes, build React, erreurs.
// Exporté sans listen() pour que les tests puissent l'utiliser.

require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const path = require('path')
const setupMiddleware = require('./middleware/setup')
const apiRouter = require('./routes/api')

const app = express()

// Uniquement si un proxy inverse réécrit réellement X-Forwarded-For.
// Sinon req.ip serait pilotable par le client, ce qui contournerait le rate limiting.
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1)
}

app.use(helmet({ contentSecurityPolicy: { directives: buildCspDirectives() } }))
setupMiddleware(app)

app.use('/api', apiRouter)

// Une route /api inconnue doit répondre en JSON, pas renvoyer le HTML du SPA
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route introuvable.' })
})

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

// La CSP par défaut d'Helmet n'autorise que 'self' : en production, où Express sert
// le build Vite, elle bloque tous les appels du navigateur vers Supabase (REST, Auth,
// Realtime, Storage). Il faut donc déclarer explicitement l'origine Supabase.
function buildCspDirectives() {
  const defaults = helmet.contentSecurityPolicy.getDefaultDirectives()
  const connect = ["'self'"]
  const img = ["'self'", 'data:']

  try {
    const { origin } = new URL(process.env.SUPABASE_URL)
    connect.push(origin, origin.replace(/^https:/, 'wss:'))
    img.push(origin)
  } catch {
    console.warn('[CSP] SUPABASE_URL absente ou invalide : connect-src reste limité à self.')
  }

  return { ...defaults, 'connect-src': connect, 'img-src': img }
}

module.exports = app
