// Traduction des erreurs renvoyées par l'API.
//
// Les routes publiques répondent { error, code } : `code` est un identifiant stable côté
// serveur (VEHICLE_UNAVAILABLE…), traduit ici via apiErrors.*. `error` reste le message
// français du serveur et sert de filet quand il n'y a pas de code — erreur inattendue
// remontée par Supabase, par exemple. Sans code ni message, on retombe sur un texte
// générique plutôt que d'afficher « undefined ».

import i18n from './i18n'

export function apiErrorMessage(payload) {
  const code = payload?.code
  if (code && i18n.exists(`apiErrors.${code}`)) {
    return i18n.t(`apiErrors.${code}`)
  }
  return payload?.error || i18n.t('common.errorRetry')
}

// Lit le corps d'une réponse en échec et en tire un message affichable. Le .catch couvre
// le cas d'une réponse sans JSON (502 d'un reverse proxy, coupure réseau).
export async function readApiError(res) {
  const payload = await res.json().catch(() => ({}))
  return apiErrorMessage(payload)
}
