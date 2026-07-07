const supabase = require('../supabase')

function findAll({ status, brand, fuel_type, limit, offset }) {
  let query = supabase.from('vehicles').select('*', { count: 'exact' }).order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (brand) query = query.eq('brand', brand)
  if (fuel_type) query = query.eq('fuel_type', fuel_type)

  return query.range(offset, offset + limit - 1)
}

function findAllOrderedByDate() {
  return supabase.from('vehicles').select('*').order('created_at', { ascending: false })
}

function findById(id) {
  return supabase.from('vehicles').select('*').eq('id', id).single()
}

function create(vehicle) {
  return supabase.from('vehicles').insert(vehicle).select().single()
}

function update(id, vehicle) {
  return supabase.from('vehicles').update(vehicle).eq('id', id).select().single()
}

function remove(id) {
  return supabase.from('vehicles').delete().eq('id', id)
}

module.exports = { findAll, findAllOrderedByDate, findById, create, update, remove }
