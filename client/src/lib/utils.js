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
