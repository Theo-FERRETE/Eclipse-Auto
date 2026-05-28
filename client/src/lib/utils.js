/**
 * Réduit le poids des images en utilisant les API de transformation
 * de Supabase Storage (/render/image) et Unsplash (imgix).
 * Pour toute autre source, retourne l'URL d'origine.
 *
 * @param {string} url     URL d'origine
 * @param {number} width   Largeur cible en px (2x la taille d'affichage pour retina)
 * @param {number} quality Qualité 1-100 (défaut 75)
 */
export function optimizeImageUrl(url, width = 800, quality = 75) {
  if (!url) return url

  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + `?width=${width}&quality=${quality}&format=webp`
  }

  if (url.startsWith('/img/')) {
    return url.replace(/\.(jpg|jpeg|png)$/i, '.webp')
  }

  return url
}

export function toSlug(brand, model) {
  return `${brand}-${model}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export const RESERVATION_STATUS = {
  pending:   { label: 'En attente', class: 'status-pending' },
  confirmed: { label: 'Confirmée',  class: 'status-confirmed' },
  cancelled: { label: 'Annulée',    class: 'status-cancelled' },
}

export const VEHICLE_STATUS = {
  available: { label: 'Disponible', badge: 'badge-available' },
  reserved:  { label: 'Réservé',    badge: 'badge-reserved' },
  sold:      { label: 'Vendu',      badge: 'badge-sold' },
}

export const FUEL_TYPES = ['Essence', 'Diesel', 'Hybride', 'Électrique']
export const TRANSMISSIONS = ['Automatique', 'Manuelle']

export function formatPrice(price) {
  if (price == null) return 'Prix sur demande'
  return `€ ${Number(price).toLocaleString('fr-FR')}`
}
