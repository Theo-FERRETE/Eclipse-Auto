// Helpers du front : images, slug d'URL, prix, libellés de statuts.

// Allège les images : Supabase Storage passe par son API de transformation, les images
// locales de /img/ basculent en .webp, le reste est renvoyé tel quel.
// width : 2x la taille d'affichage, pour les écrans retina.
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

// "Renault M\u00e9gane RS" -> "renault-megane-rs". normalize('NFD') d\u00e9tache les accents pour
// que le replace suivant les retire proprement.
// Le serveur fait la m\u00eame chose dans vehicleController.getBySlug.
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
