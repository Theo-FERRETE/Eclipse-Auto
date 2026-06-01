import { supabase } from './supabase'
import { toSlug } from './utils'

let _cache = null
let _cacheTime = 0
const TTL = 3 * 60 * 1000 // 3 minutes

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

export async function getVehicles() {
  if (_cache && Date.now() - _cacheTime < TTL) {
    return { data: _cache, error: null }
  }
  return fetchFromDB()
}

export async function getVehicleBySlug(slug) {
  if (_cache && Date.now() - _cacheTime < TTL) {
    const found = _cache.find(v => toSlug(v.brand, v.model) === slug)
    return { data: found || null, error: found ? null : { message: 'Véhicule introuvable.' } }
  }

  // Appel ciblé : évite de charger tout le catalogue juste pour une fiche
  const res = await fetch(`/api/vehicles/by-slug/${encodeURIComponent(slug)}`)
  if (!res.ok) return { data: null, error: { message: 'Véhicule introuvable.' } }
  const data = await res.json()
  return { data, error: null }
}

export function patchCachedVehicle(updated) {
  if (_cache) {
    _cache = _cache.map(v => v.id === updated.id ? { ...v, ...updated } : v)
  }
}

export function invalidateVehiclesCache() {
  _cache = null
  _cacheTime = 0
}
