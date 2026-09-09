// Requêtes des réservations (essais).

const supabase = require('../supabase')

// La syntaxe « table(colonnes) » est l'embed PostgREST : une jointure en une seule requête.
// Ne marche que s'il existe une clé étrangère (voir findProfilesByIds pour le contre-exemple).
function findByClient(clientId) {
  return supabase
    .from('reservations')
    .select('*, vehicles(brand, model, images, price)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
}

function findAll({ status, limit, offset }) {
  let query = supabase
    .from('reservations')
    .select('*, vehicles(brand, model, images, price)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  return query.range(offset, offset + limit - 1)
}

// Pas de clé étrangère reservations.client_id -> profiles.id, donc pas d'embed
// PostgREST possible : les profils sont résolus en une seconde requête.
function findProfilesByIds(ids) {
  return supabase.from('profiles').select('id, first_name, last_name').in('id', ids)
}

function findVehicleStatus(vehicleId) {
  return supabase.from('vehicles').select('status').eq('id', vehicleId).single()
}

function create(reservation) {
  return supabase.from('reservations').insert(reservation).select().single()
}

function findWithVehicleForEmail(id) {
  return supabase
    .from('reservations')
    .select('client_id, rdv_date, rdv_date_fin, vehicles(brand, model, year, price)')
    .eq('id', id)
    .single()
}

function updateStatus(id, status) {
  return supabase.from('reservations').update({ status }).eq('id', id).select().single()
}

// Bascule en 'completed' tout essai confirmé dont la période est dépassée.
// Le trigger sync_vehicle_status_on_reservation (migration 001) remet alors
// le véhicule en 'available' — même mécanisme qu'une annulation manuelle,
// juste déclenché par le temps plutôt que par un admin.
function expireCompleted() {
  return supabase
    .from('reservations')
    .update({ status: 'completed' })
    .eq('status', 'confirmed')
    .lt('rdv_date_fin', new Date().toISOString())
    .select('id, vehicle_id')
}

function getAuthUserAndProfile(clientId) {
  return Promise.all([
    supabase.auth.admin.getUserById(clientId),
    supabase.from('profiles').select('first_name').eq('id', clientId).single(),
  ])
}

function findClientAndStatus(id) {
  return supabase.from('reservations').select('client_id, status').eq('id', id).single()
}

function cancel(id) {
  return supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id).select().single()
}

module.exports = {
  findByClient,
  findAll,
  findProfilesByIds,
  findVehicleStatus,
  create,
  findWithVehicleForEmail,
  updateStatus,
  expireCompleted,
  getAuthUserAndProfile,
  findClientAndStatus,
  cancel,
}
