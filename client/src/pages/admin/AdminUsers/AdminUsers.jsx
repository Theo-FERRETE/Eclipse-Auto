import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import AdminPageHeader from '@/components/AdminPageHeader/AdminPageHeader'
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import './AdminUsers.css'

export default function AdminUsers() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function fetchClients() {
    setLoading(true)
    const token = await getToken()
    const res = await fetch('/api/admin/clients', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setClients(json.data || [])
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchClients() }, [])

  async function confirmDelete() {
    const token = await getToken()
    await fetch(`/api/admin/clients/${confirmId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    setConfirmId(null)
    fetchClients()
  }

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="admin">
      <AdminPageHeader title="Clients" />
      <div className="container admin-layout">
        <AdminSidebar />

        <div className="admin-content">
          <div className="admin-toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher un client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          {loading ? (
            <div className="dashboard-loading"><div className="loader"></div></div>
          ) : (
            <div className="users-list">
              {filtered.map(c => (
                <div className="user-card" key={c.id}>
                  <div className="user-avatar">
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{c.first_name} {c.last_name}</div>
                    {c.phone && <div className="user-phone">{c.phone}</div>}
                    <div className="user-date">
                      Inscrit le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="user-actions">
                    <span className="badge-available">Client</span>
                    <button
                      className="action-btn delete"
                      onClick={() => setConfirmId(c.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="catalogue-empty">
                  <p>Aucun client trouvé.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {confirmId && (
        <ConfirmModal
          message="Supprimer ce client définitivement ?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </main>
  )
}