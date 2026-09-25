// Vérification du JWT. requireAuth = connecté (401 sinon), requireAdmin = admin (403 sinon).
// Le rôle est lu dans app_metadata, que l'utilisateur ne peut pas modifier lui-même.

const supabase = require('../supabase')
const { fail } = require('../lib/apiError')

// Extrait le token de « Authorization: Bearer <token> ». En-tête absent ou mal formé : null.
function getTokenFromHeader(req) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  return header.split(' ')[1]
}

// C'est Supabase qui vérifie la signature et l'expiration. Un token modifié ne passe pas,
// d'où la confiance qu'on peut accorder à req.user.id dans les contrôleurs.
// Le `code` accompagne le message pour que le client bilingue puisse le traduire
// (voir lib/apiError.js).
async function verifyToken(token) {
  if (!token) return { error: 'Token manquant.', code: 'TOKEN_MISSING' }
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return { error: 'Token invalide ou expiré.', code: 'TOKEN_INVALID' }
  }
  return { user }
}

async function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req)
  const { user, error, code } = await verifyToken(token)

  if (error) return fail(res, 401, code, error)

  req.user = user
  next()
}

async function requireAdmin(req, res, next) {
  const token = getTokenFromHeader(req)
  const { user, error, code } = await verifyToken(token)

  // 401 = je ne sais pas qui tu es. 403 juste en dessous = je le sais, mais tu n'as pas le droit.
  if (error) return fail(res, 401, code, error)

  if (user.app_metadata?.role !== 'admin') {
    return fail(res, 403, 'ADMIN_ONLY', 'Accès réservé aux administrateurs.')
  }

  req.user = user
  next()
}

module.exports = { requireAuth, requireAdmin }
