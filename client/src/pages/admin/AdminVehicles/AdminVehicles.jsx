// Liste des véhicules. Le CRUD passe par une page dédiée (voir AdminVehicleForm),
// pas une modale.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import AdminPageHeader from '@/components/AdminPageHeader/AdminPageHeader'
import Pagination from '@/components/Pagination/Pagination'
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import AdminVehicleCard from '@/components/AdminVehicleCard/AdminVehicleCard'
import './AdminVehicles.css'

const ITEMS_PER_PAGE = 6

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [confirmId, setConfirmId] = useState(null)
  const [statusError, setStatusError] = useState(null)

  async function fetchVehicles() {
    setLoading(true)
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    setVehicles(data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchVehicles() }, [])

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function confirmDelete() {
    const token = await getToken()
    const res = await fetch(`/api/vehicles/${confirmId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    setConfirmId(null)
    if (!res.ok) { alert('Impossible de supprimer ce véhicule.'); return }
    fetchVehicles()
  }

  async function handleStatusChange(vehicle, status) {
    const token = await getToken()
    const res = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...vehicle, status }),
    })
    if (!res.ok) {
      setStatusError('Impossible de modifier le statut.')
      return
    }
    setStatusError(null)
    fetchVehicles()
  }

  const filtered = vehicles.filter(v =>
    `${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <main className="admin">
      <AdminPageHeader title="Véhicules" />
      <div className="page-section admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-list">
            {statusError && (
              <div className="form-error" role="alert" style={{ marginBottom: '16px' }}>{statusError}</div>
            )}
            <div className="admin-toolbar">
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                style={{ flex: 1 }}
              />
              <Link to="/admin/vehicles/new" className="btn-primary">+ Ajouter</Link>
            </div>
            {loading ? (
              <div className="dashboard-loading"><div className="loader"></div></div>
            ) : (
              <>
                <div className="card-grid admin-vehicles-grid">
                  {paginated.map(v => (
                    <AdminVehicleCard
                      key={v.id}
                      vehicle={v}
                      onDelete={setConfirmId}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <div className="catalogue-empty"><p>Aucun véhicule trouvé.</p></div>
                  )}
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>
      {confirmId && (
        <ConfirmModal
          message="Supprimer ce véhicule définitivement ?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </main>
  )
}
