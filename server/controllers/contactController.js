const nodemailer = require('nodemailer')
const { escapeHtml } = require('../lib/emailTemplates')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const ipRequestCounts = new Map()
const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 5

// Sans purge, la Map conserverait une entrée par IP vue depuis le démarrage.
function purgeExpired(now) {
  for (const [ip, times] of ipRequestCounts) {
    if (times.every(t => now - t >= WINDOW_MS)) ipRequestCounts.delete(ip)
  }
}

function checkRateLimit(ip) {
  const now = Date.now()
  const windowMs = WINDOW_MS
  const maxRequests = MAX_REQUESTS

  purgeExpired(now)

  if (!ipRequestCounts.has(ip)) {
    ipRequestCounts.set(ip, [])
  }

  const requests = ipRequestCounts.get(ip).filter(time => now - time < windowMs)
  ipRequestCounts.set(ip, requests)

  if (requests.length >= maxRequests) {
    return false
  }

  requests.push(now)
  ipRequestCounts.set(ip, requests)
  return true
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

// POST /api/contact — formulaire de contact
async function send(req, res) {
  const clientIp = req.ip || req.connection.remoteAddress
  const { name, email, phone, subject, message } = req.body

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Trop de requêtes. Réessayez dans 15 minutes.' })
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, email et message sont obligatoires.' })
  }

  if (!isValidEmail(email) || /[\r\n]/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' })
  }

  if (name.length > 100 || message.length > 5000) {
    return res.status(400).json({ error: 'Champs trop longs.' })
  }

  try {
    await transporter.sendMail({
      from: `"Eclipse Auto" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `[Eclipse Auto] ${escapeHtml(subject || 'Nouveau message')}`,
      html: `
        <p><strong>De :</strong> ${escapeHtml(name)} (${escapeHtml(email)}${phone ? ` — ${escapeHtml(phone)}` : ''})</p>
        <p><strong>Message :</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    })

    res.json({ success: true, message: 'Message envoyé.' })
  } catch (err) {
    console.error('[Contact] Erreur envoi email :', err)
    res.status(500).json({ error: "Erreur lors de l'envoi du message." })
  }
}

module.exports = { send }
