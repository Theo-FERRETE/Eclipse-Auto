// Compteurs du tableau de bord et gestion des clients.

const supabase = require('../supabase')

// head: true = on veut juste le COUNT, pas les lignes.
// Promise.all pour lancer les huit comptages en parallèle plutôt qu'à la suite.
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

// Supprime le compte auth et pas seulement la ligne profiles, sinon il pourrait encore se
// connecter. Réservé à la clé service_role.
function deleteClient(id) {
  return supabase.auth.admin.deleteUser(id)
}

module.exports = { getStats, findClients, deleteClient }
