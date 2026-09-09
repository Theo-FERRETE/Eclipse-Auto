// Valeurs autorisées, partagées par les contrôleurs.

const VEHICLE_STATUSES = ['available', 'reserved', 'sold']
const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed']
const VENTE_STATUSES = ['pending', 'confirmed', 'cancelled']
const PAYMENT_METHODS = ['carte', 'virement', 'financement', 'especes']
const FUEL_TYPES = ['essence', 'diesel', 'hybride', 'électrique']
const TRANSMISSIONS = ['automatique', 'manuelle']

module.exports = {
  VEHICLE_STATUSES,
  RESERVATION_STATUSES,
  VENTE_STATUSES,
  PAYMENT_METHODS,
  FUEL_TYPES,
  TRANSMISSIONS,
}
