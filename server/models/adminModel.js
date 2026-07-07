const supabase = require('../supabase')

function getStats() {
  return Promise.all([
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'reserved'),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
  ])
}

function findClients({ limit, offset }) {
  return supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
}

function deleteClient(id) {
  return supabase.auth.admin.deleteUser(id)
}

module.exports = { getStats, findClients, deleteClient }
