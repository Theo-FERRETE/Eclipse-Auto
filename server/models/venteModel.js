// Requêtes des ventes, avec les équipements et le véhicule liés.

const supabase = require('../supabase')

// Même embed PostgREST que reservationModel : nécessite les clés étrangères
// ventes.vehicle_id -> vehicles.id et vente_equipements.vente_id -> ventes.id.
function findByClient(clientId) {
  return supabase
    .from('ventes')
    .select('*, vehicles(brand, model, images, price), vente_equipements(equipements(id, nom, prix_supplement))')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
}

function findAll({ status, limit, offset }) {
  let query = supabase
    .from('ventes')
    .select('*, vehicles(brand, model, images, price), vente_equipements(equipements(id, nom, prix_supplement))', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  return query.range(offset, offset + limit - 1)
}

// Pas de clé étrangère ventes.client_id -> profiles.id (même limitation que reservations,
// voir reservationModel.findProfilesByIds) : les profils sont résolus en une seconde requête.
function findProfilesByIds(ids) {
  return supabase.from('profiles').select('id, first_name, last_name').in('id', ids)
}

function findVehicleForSale(vehicleId) {
  return supabase.from('vehicles').select('id, price, status').eq('id', vehicleId).single()
}

function findEquipementsByIds(ids) {
  return supabase.from('equipements').select('id, nom, prix_supplement').in('id', ids)
}

function create(vente) {
  return supabase.from('ventes').insert(vente).select().single()
}

function linkEquipements(venteId, equipementIds) {
  const rows = equipementIds.map(eid => ({ vente_id: venteId, equipement_id: eid }))
  return supabase.from('vente_equipements').insert(rows)
}

function findWithDetailsForEmail(id) {
  return supabase
    .from('ventes')
    .select('client_id, prix_final, mode_paiement, vehicles(brand, model, year), vente_equipements(equipements(nom))')
    .eq('id', id)
    .single()
}

function updateStatus(id, status) {
  return supabase.from('ventes').update({ status }).eq('id', id).select().single()
}

function getAuthUserAndProfile(clientId) {
  return Promise.all([
    supabase.auth.admin.getUserById(clientId),
    supabase.from('profiles').select('first_name').eq('id', clientId).single(),
  ])
}

module.exports = {
  findByClient,
  findAll,
  findProfilesByIds,
  findVehicleForSale,
  findEquipementsByIds,
  create,
  linkEquipements,
  findWithDetailsForEmail,
  updateStatus,
  getAuthUserAndProfile,
}
