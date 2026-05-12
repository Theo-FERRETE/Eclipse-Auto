const cors = require('cors')
const express = require('express')
const morgan = require('morgan')

module.exports = function setupMiddleware(app) {
  const isProd = process.env.NODE_ENV === 'production'

  if (!isProd) {
    app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    }))
    app.use(morgan('dev'))
  } else {
    app.use(morgan('combined'))
  }

  app.use(express.json())
}


