const { createClient } = require('@supabase/supabase-js')
const supabase = require('../supabase')

function getTokenFromHeader(req) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  return header.split(' ')[1]
}

async function verifyToken(token) {
  if (!token) return { error: 'Token manquant.' }
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return { error: 'Token invalide ou expiré.' }
  }
  return { user }
}

async function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req)
  const { user, error } = await verifyToken(token)

  if (error) return res.status(401).json({ error })

  req.user = user
  next()
}

async function requireAdmin(req, res, next) {
  const token = getTokenFromHeader(req)
  const { user, error } = await verifyToken(token)

  if (error) return res.status(401).json({ error })

  const userClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: profile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' })
  }

  req.user = user
  req.profile = profile
  next()
}

module.exports = { requireAuth, requireAdmin }
