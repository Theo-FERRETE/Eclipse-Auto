// Réponse d'erreur des routes publiques.
//
// Le client React est bilingue : il ne peut pas afficher telle quelle une phrase française
// renvoyée par l'API. On joint donc un `code` stable, que le front traduit (voir
// client/src/lib/apiError.js). Le message français reste dans la réponse : il sert aux
// appels hors navigateur (curl, tests d'intégration) et de filet quand le client ne
// connaît pas encore le code.
//
// Les routes réservées à l'admin s'en passent : le back-office n'est pas traduit.
function fail(res, status, code, message) {
  return res.status(status).json({ error: message, code })
}

module.exports = { fail }
