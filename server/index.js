const app = require('./app')

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GMAIL_USER', 'GMAIL_APP_PASSWORD']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length) {
  console.error(`[Démarrage] Variables d'environnement manquantes : ${missing.join(', ')}`)
  process.exit(1)
}

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Eclipse Auto — http://localhost:${PORT}`)
})
