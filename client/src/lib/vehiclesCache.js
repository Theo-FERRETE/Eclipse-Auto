// Cache du catalogue (3 min) partagé entre les pages. En mémoire de l'onglet, pas en
// localStorage : les statuts bougent, un cache persistant afficherait du périmé.

import { supabase } from './supabase'
import { toSlug } from './utils'

// Variables de module : un seul exemplaire pour tout l'onglet, quel que soit le nombre de
// composants qui importent ce fichier. C'est ce qui rend le cache partagé.
let _cache = null
let _cacheTime = 0
const TTL = 3 * 60 * 1000 // 3 minutes

// On n'écrit dans le cache que si la requête a ramené des données : en cas d'erreur réseau,
// mieux vaut garder l'ancien contenu que de le vider.
async function fetchFromDB() {
  const result = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })
  if (result.data) {
    _cache = result.data
    _cacheTime = Date.now()
  }
  return result
}

// Même forme que Supabase ({ data, error }) : l'appelant n'a pas à savoir d'où ça vient.
export async function getVehicles() {
  if (_cache && Date.now() - _cacheTime < TTL) {
    return { data: _cache, error: null }
  }
  return fetchFromDB()
}

// Cache chaud : on cherche dedans, zéro requête. Cache froid (arrivée directe par un lien
// ou un F5) : on demande la fiche à l'API plutôt que de recharger tout le catalogue.
export async function getVehicleBySlug(slug) {
  if (_cache && Date.now() - _cacheTime < TTL) {
    const found = _cache.find(v => toSlug(v.brand, v.model) === slug)
    return { data: found || null, error: found ? null : { message: 'Véhicule introuvable.' } }
  }

  // encodeURIComponent : le slug vient de l'utilisateur, un / ou un ? changerait la route.
  const res = await fetch(`/api/vehicles/by-slug/${encodeURIComponent(slug)}`)
  if (!res.ok) return { data: null, error: { message: 'Véhicule introuvable.' } }
  const data = await res.json()
  return { data, error: null }
}

// Met à jour une seule entrée, appelée par le Realtime. On remplace le tableau plutôt que
// de modifier l'objet : React compare les références. Le TTL n'est pas remis à zéro, le
// reste du cache a toujours le même âge.
export function patchCachedVehicle(updated) {
  if (_cache) {
    _cache = _cache.map(v => v.id === updated.id ? { ...v, ...updated } : v)
  }
}

// Force le prochain appel à repartir en base.
// Exportée mais jamais appelée pour l'instant : à brancher après une création ou une
// suppression en back-office, ou à supprimer.
export function invalidateVehiclesCache() {
  _cache = null
  _cacheTime = 0
}
