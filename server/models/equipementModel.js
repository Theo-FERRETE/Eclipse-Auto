const supabase = require('../supabase')

function findAll() {
  return supabase.from('equipements').select('*').order('categorie').order('nom')
}

function create(equipement) {
  return supabase.from('equipements').insert(equipement).select().single()
}

function update(id, equipement) {
  return supabase.from('equipements').update(equipement).eq('id', id).select().single()
}

function remove(id) {
  return supabase.from('equipements').delete().eq('id', id)
}

module.exports = { findAll, create, update, remove }
