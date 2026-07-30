const supabase = require('../supabase')

function findByClient(clientId) {
  return supabase
    .from('reservations')
    .select('*, vehicles(brand, model, images, price), reservation_equipements(equipements(id, nom, prix_supplement))')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
}

function findAll({ status, limit, offset }) {
  let query = supabase
    .from('reservations')
    .select('*, vehicles(brand, model, images, price), reservation_equipements(equipements(id, nom, prix_supplement))', { count: 'exact' })
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

function linkEquipements(reservationId, equipementIds) {
  const rows = equipementIds.map(eid => ({ reservation_id: reservationId, equipement_id: eid }))
  return supabase.from('reservation_equipements').insert(rows)
}

function findWithVehicleForEmail(id) {
  return supabase
    .from('reservations')
    .select('client_id, rdv_date, vehicles(brand, model, year, price)')
    .eq('id', id)
    .single()
}

function updateStatus(id, status) {
  return supabase.from('reservations').update({ status }).eq('id', id).select().single()
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
  linkEquipements,
  findWithVehicleForEmail,
  updateStatus,
  getAuthUserAndProfile,
  findClientAndStatus,
  cancel,
}
