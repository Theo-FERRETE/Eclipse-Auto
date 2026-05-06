const cors = require('cors')
const express = require('express')

module.exports = function setupMiddleware(app) {
  const isProd = process.env.NODE_ENV === 'production'

  if (!isProd) {
    app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    }))
  }

  app.use(express.json())
}
