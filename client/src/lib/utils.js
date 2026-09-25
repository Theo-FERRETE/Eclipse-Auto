// Helpers du front : images, slug d'URL, prix, dates, libellés de statuts.

import i18n from './i18n'

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

// "Renault Mégane RS" -> "renault-megane-rs". normalize('NFD') détache les accents pour
// que le replace suivant les retire proprement.
// Le serveur fait la même chose dans vehicleController.getBySlug.
export function toSlug(brand, model) {
  return `${brand}-${model}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// Ces trois tables gardent leurs libellés français : elles servent au back-office admin,
// qui n'est pas traduit. Côté public, les composants passent par les clés
// status.vehicle.* / status.reservation.* / status.vente.* et n'utilisent d'ici que la
// classe CSS.
export const RESERVATION_STATUS = {
  pending:   { label: 'En attente', class: 'status-pending' },
  confirmed: { label: 'Confirmée',  class: 'status-confirmed' },
  cancelled: { label: 'Annulée',    class: 'status-cancelled' },
  completed: { label: 'Terminé',    class: 'status-completed' },
}

export const VENTE_STATUS = {
  pending:   { label: 'En attente', class: 'status-pending' },
  confirmed: { label: 'Confirmée',  class: 'status-confirmed' },
  cancelled: { label: 'Annulée',    class: 'status-cancelled' },
}

export const PAYMENT_METHOD_LABELS = {
  carte:        'Carte bancaire',
  virement:     'Virement',
  financement:  'Financement',
  especes:      'Espèces',
}

export const VEHICLE_STATUS = {
  available: { label: 'Disponible', badge: 'badge-available' },
  reserved:  { label: 'Réservé',    badge: 'badge-reserved' },
  sold:      { label: 'Vendu',      badge: 'badge-sold' },
}

export const FUEL_TYPES = ['Essence', 'Diesel', 'Hybride', 'Électrique']
export const TRANSMISSIONS = ['Automatique', 'Manuelle']

// Locale de formatage des nombres et des dates, déduite de la langue courante. Séparée
// de la langue i18next parce que 'en' seul laisserait Intl choisir un format par défaut :
// en-GB donne le jour avant le mois, cohérent avec le reste du site.
function locale() {
  return i18n.resolvedLanguage === 'en' ? 'en-GB' : 'fr-FR'
}

export function formatNumber(value) {
  return Number(value).toLocaleString(locale())
}

export function formatPrice(price) {
  if (price == null) return i18n.t('common.priceOnRequest')
  return `€ ${formatNumber(price)}`
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString(locale())
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString(locale())
}

// Normalise la casse d'un champ texte pour l'affichage (la donnée en base n'est pas
// toujours cohérente, ex. fuel_type stocké en 'ESSENCE').
export function capitalize(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Carburant et transmission sont stockés en français en base : 'Essence', 'Automatique'…
// Ces deux helpers traduisent l'affichage sans toucher à la valeur, qui reste celle de la
// base (les filtres du catalogue comparent dessus). Une valeur inconnue est simplement
// affichée telle quelle.
function translateDbValue(namespace, value) {
  if (!value) return value
  const key = `${namespace}.${value.toLowerCase()}`
  return i18n.exists(key) ? i18n.t(key) : capitalize(value)
}

export function translateFuel(value) {
  return translateDbValue('fuel', value)
}

export function translateTransmission(value) {
  return translateDbValue('transmission', value)
}

export function translatePaymentMethod(value) {
  const key = `payment.${value}`
  return i18n.exists(key) ? i18n.t(key) : value
}
