import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import AdminPageHeader from '@/components/AdminPageHeader/AdminPageHeader'
import Pagination from '@/components/Pagination/Pagination'
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import AdminVehicleCard from '@/components/AdminVehicleCard/AdminVehicleCard'
import AdminVehicleModal from '@/components/AdminVehicleModal/AdminVehicleModal'
import './AdminVehicles.css'

const EMPTY_FORM = {
  brand: '', model: '', year: '', price: '',
  fuel_type: '', transmission: '', mileage: '',
  power: '', description: '', status: 'available', image: '',
}

const ITEMS_PER_PAGE = 5

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchVehicles() }, [])

  async function fetchVehicles() {
    setLoading(true)
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    setVehicles(data || [])
    setLoading(false)
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setError(null); setSuccess(null); setShowForm(true)
  }

  function openEdit(vehicle) {
    setEditing(vehicle.id)
    setForm({
      brand: vehicle.brand || '', model: vehicle.model || '', year: vehicle.year || '',
      price: vehicle.price || '', fuel_type: vehicle.fuel_type || '',
      transmission: vehicle.transmission || '', mileage: vehicle.mileage || '',
      power: vehicle.power || '', description: vehicle.description || '',
      status: vehicle.status || 'available', image: vehicle.images?.[0] || '',
    })
    setError(null); setSuccess(null); setShowForm(true)
  }

  function closeForm() {
    setShowForm(false); setEditing(null); setForm(EMPTY_FORM); setError(null); setSuccess(null)
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setSubmitting(true)
    const payload = {
      brand: form.brand, model: form.model, year: parseInt(form.year),
      price: parseFloat(form.price), fuel_type: form.fuel_type,
      transmission: form.transmission, mileage: form.mileage ? parseInt(form.mileage) : 0,
      power: form.power || null, description: form.description || null,
      status: form.status, images: form.image ? [form.image] : [],
    }
    try {
      const token = await getToken()
      const res = await fetch(editing ? `/api/vehicles/${editing}` : '/api/vehicles', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.')
      setSuccess(editing ? 'Modifié avec succès.' : 'Ajouté avec succès.')
      await fetchVehicles()
      setTimeout(() => closeForm(), 1500)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
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
    await fetch(`/api/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...vehicle, status }),
    })
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
      <div className="container admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-vehicles-wrap">
            <div className="admin-list">
              <div className="admin-toolbar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  style={{ flex: 1 }}
                />
                <button className="btn-primary" onClick={openCreate}>+ Ajouter</button>
              </div>
              {loading ? (
                <div className="dashboard-loading"><div className="loader"></div></div>
              ) : (
                <>
                  <div className="admin-vehicles-list">
                    {paginated.map(v => (
                      <AdminVehicleCard
                        key={v.id}
                        vehicle={v}
                        editing={editing}
                        onEdit={openEdit}
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
            {showForm && (
              <AdminVehicleModal
                form={form}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onClose={closeForm}
                editing={editing}
                submitting={submitting}
                error={error}
                success={success}
              />
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
