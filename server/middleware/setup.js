// Middlewares communs : compression, CORS, logs, parsing du JSON.

const cors = require('cors')
const express = require('express')
const morgan = require('morgan')
const compression = require('compression')

module.exports = function setupMiddleware(app) {
  const isProd = process.env.NODE_ENV === 'production'

  // L'ordre compte : les middlewares s'exécutent dans l'ordre de déclaration.
  app.use(compression())

  // Une seule origine autorisée, pas '*' : sinon n'importe quel site pourrait faire appeler
  // l'API par le navigateur de nos visiteurs.
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }))

  // 'dev' est court et coloré ; 'combined' suit le format Apache, lisible par les outils
  // d'analyse de logs.
  if (!isProd) {
    app.use(morgan('dev'))
  } else {
    app.use(morgan('combined'))
  }

  // Remplit req.body. Sans lui, req.body serait undefined dans tous les contrôleurs.
  app.use(express.json())
}


