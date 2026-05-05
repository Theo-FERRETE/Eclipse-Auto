const { Router } = require('express')
const nodemailer = require('nodemailer')

const router = Router()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// POST /api/contact — formulaire de contact
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, email et message sont obligatoires.' })
  }

  try {
    await transporter.sendMail({
      from: `"Eclipse Auto" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `[Eclipse Auto] ${subject || 'Nouveau message'}`,
      html: `
        <p><strong>De :</strong> ${name} (${email}${phone ? ` — ${phone}` : ''})</p>
        <p><strong>Message :</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    res.json({ success: true, message: 'Message envoyé.' })
  } catch (err) {
    console.error('[Contact] Erreur envoi email :', err)
    res.status(500).json({ error: "Erreur lors de l'envoi du message." })
  }
})

module.exports = router
