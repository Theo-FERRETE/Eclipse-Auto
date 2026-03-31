const { Router } = require('express')

const router = Router()

// POST /api/contact — formulaire de contact
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, email et message sont obligatoires.' })
  }

  // TODO: intégrer Resend pour l'envoi email
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'Eclipse Auto <contact@eclipse-auto.theo-ferrete.fr>',
  //   to: 'theo.ferrete@gmail.com',
  //   subject: `[Eclipse Auto] ${subject || 'Nouveau message'}`,
  //   html: `<p><strong>${name}</strong> (${email}${phone ? ` — ${phone}` : ''})</p><p>${message}</p>`,
  // })

  console.log(`[Contact] ${name} <${email}> : ${message}`)
  res.json({ success: true, message: 'Message reçu.' })
})

module.exports = router
