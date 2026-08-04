// Client Supabase du serveur, clé service_role : elle contourne la RLS et ne doit jamais
// sortir d'ici. Le front utilise la clé anon.

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

module.exports = supabase
