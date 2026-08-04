// Conversion URL <-> filtres. Les valeurs par défaut ne sont pas écrites dans l'URL.

export const DEFAULT_STATUS = ['available', 'reserved', 'sold']
export const ITEMS_PER_PAGE = 6

// URL -> filtres. getAll() et non get() pour status : c'est le seul filtre multi-valeurs,
// il apparaît autant de fois qu'il y a de statuts cochés.
export function filtersFromParams(params) {
  const statusArr = params.getAll('status')
  return {
    brand: params.get('brand') || '',
    fuel_type: params.get('fuel_type') || '',
    transmission: params.get('transmission') || '',
    // Infinity = pas de plafond : le filtre s'écrit v.price <= Infinity, toujours vrai.
    price_max: params.get('price_max') ? Number(params.get('price_max')) : Infinity,
    year_min: params.get('year_min') || '',
    // Aucun statut dans l'URL = tous cochés. Une copie, pas la référence, sinon on
    // modifierait la constante partagée.
    status: statusArr.length ? statusArr : [...DEFAULT_STATUS],
  }
}

// Filtres -> URL. Les valeurs par défaut sont omises pour garder l'URL courte.
export function buildParams(filters, sort, search) {
  const params = new URLSearchParams()
  if (filters.brand) params.set('brand', filters.brand)
  if (filters.fuel_type) params.set('fuel_type', filters.fuel_type)
  if (filters.transmission) params.set('transmission', filters.transmission)
  if (filters.price_max !== Infinity) params.set('price_max', String(filters.price_max))
  if (filters.year_min) params.set('year_min', filters.year_min)
  // append et non set : status peut apparaître plusieurs fois, set écraserait à chaque tour.
  const isDefaultStatus = DEFAULT_STATUS.every(s => filters.status.includes(s)) && filters.status.length === 3
  if (!isDefaultStatus) filters.status.forEach(s => params.append('status', s))
  if (sort && sort !== 'default') params.set('sort', sort)
  if (search) params.set('q', search)
  return params
}
