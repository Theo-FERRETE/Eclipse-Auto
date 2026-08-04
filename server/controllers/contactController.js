// Formulaire de contact : validation, rate limiting par IP, envoi Nodemailer.

const nodemailer = require('nodemailer')
const { escapeHtml } = require('../lib/emailTemplates')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// Rate limiting maison : fenêtre glissante de 15 min par IP. Ça évite une dépendance de
// plus. Le compteur vit en mémoire du processus, donc il repart à zéro à chaque
// redémarrage — suffisant ici, il faudrait Redis à plus grande échelle.
const ipRequestCounts = new Map()
const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 5

// Sans purge, la Map garderait une entrée par IP vue depuis le démarrage : fuite de mémoire.
function purgeExpired(now) {
  for (const [ip, times] of ipRequestCounts) {
    if (times.every(t => now - t >= WINDOW_MS)) ipRequestCounts.delete(ip)
  }
}

// Retourne false si l'IP a épuisé son quota.
function checkRateLimit(ip) {
  const now = Date.now()
  const windowMs = WINDOW_MS
  const maxRequests = MAX_REQUESTS

  purgeExpired(now)

  if (!ipRequestCounts.has(ip)) {
    ipRequestCounts.set(ip, [])
  }

  // C'est ce filtre qui fait « glisser » la fenêtre, au lieu de la remettre à zéro d'un bloc.
  const requests = ipRequestCounts.get(ip).filter(time => now - time < windowMs)
  ipRequestCounts.set(ip, requests)

  if (requests.length >= maxRequests) {
    return false
  }

  requests.push(now)
  ipRequestCounts.set(ip, requests)
  return true
}

// Volontairement permissif : une regex strictement conforme à la RFC est illisible et
// rejette des adresses valides. 254 = longueur maximale d'une adresse.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

// POST /api/contact — formulaire de contact
async function send(req, res) {
  const clientIp = req.ip || req.connection.remoteAddress
  const { name, email, phone, subject, message } = req.body

  // Avant la validation, sinon on pourrait marteler la route avec des corps invalides
  // sans jamais consommer son quota.
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Trop de requêtes. Réessayez dans 15 minutes.' })
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, email et message sont obligatoires.' })
  }

  // Le test des retours à la ligne bloque l'injection d'en-têtes SMTP : un "x@y.fr\nBcc: ..."
  // ajouterait de vrais destinataires et ferait de ce formulaire un relais de spam.
  if (!isValidEmail(email) || /[\r\n]/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' })
  }

  // Sans plafond, un message de 50 Mo serait accepté et envoyé.
  if (name.length > 100 || message.length > 5000) {
    return res.status(400).json({ error: 'Champs trop longs.' })
  }

  try {
    await transporter.sendMail({
      // from reste notre adresse, sinon Gmail y verrait une usurpation. C'est replyTo qui
      // fait que « Répondre » écrit bien au visiteur.
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
    // On logue l'erreur réelle mais on ne la renvoie pas : elle contient la réponse brute
    // de Gmail.
    console.error('[Contact] Erreur envoi email :', err)
    res.status(500).json({ error: "Erreur lors de l'envoi du message." })
  }
}

module.exports = { send }
