import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { optimizeImageUrl, formatPrice } from '@/lib/utils'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import AdminPageHeader from '@/components/AdminPageHeader/AdminPageHeader'
import Pagination from '@/components/Pagination/Pagination'
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import './AdminVehicles.css'

const EMPTY_FORM = {
  brand: '', model: '', year: '', price: '',
  fuel_type: '', transmission: '', mileage: '',
  power: '', description: '', status: 'available',
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
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setSuccess(null)
    setShowForm(true)
  }

  function openEdit(vehicle) {
    setEditing(vehicle.id)
    setForm({
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      price: vehicle.price || '',
      fuel_type: vehicle.fuel_type || '',
      transmission: vehicle.transmission || '',
      mileage: vehicle.mileage || '',
      power: vehicle.power || '',
      description: vehicle.description || '',
      status: vehicle.status || 'available',
    })
    setError(null)
    setSuccess(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setSuccess(null)
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const payload = {
      brand: form.brand,
      model: form.model,
      year: parseInt(form.year),
      price: parseFloat(form.price),
      fuel_type: form.fuel_type,
      transmission: form.transmission,
      mileage: form.mileage ? parseInt(form.mileage) : 0,
      power: form.power || null,
      description: form.description || null,
      status: form.status,
    }
    try {
      const token = await getToken()
      const url = editing ? `/api/vehicles/${editing}` : '/api/vehicles'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
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
                      <div key={v.id} className={`admin-vehicle-card ${editing === v.id ? 'active' : ''}`}>
                        <div className="avc-img">
                          {v.images?.[0]
                            ? <img
                                src={optimizeImageUrl(v.images[0], 200)}
                                alt={`${v.brand} ${v.model}`}
                                loading="lazy"
                                decoding="async"
                                style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                                onLoad={e => { e.currentTarget.style.opacity = '1' }}
                              />
                            : <div className="avc-img-placeholder"></div>
                          }
                          <div className="gallery-bar"></div>
                        </div>
                        <div className="avc-info">
                          <div className="vcard-brand">{v.brand}</div>
                          <div className="avc-model">{v.model}</div>
                          <div className="vcard-specs">
                            <span>{v.year}</span>
                            <span className="spec-dot"></span>
                            <span>{v.fuel_type}</span>
                          </div>
                        </div>
                        <div className="avc-right">
                          <div className="avc-price">{formatPrice(v.price)}</div>
                          <select
                            className="status-select"
                            value={v.status}
                            onChange={e => handleStatusChange(v, e.target.value)}
                          >
                            <option value="available">Disponible</option>
                            <option value="reserved">Réservé</option>
                            <option value="sold">Vendu</option>
                          </select>
                          <div className="avc-actions">
                            <button className="action-btn edit" onClick={() => openEdit(v)}>Modifier</button>
                            <button className="action-btn delete" onClick={() => setConfirmId(v.id)}>Supprimer</button>
                          </div>
                        </div>
                      </div>
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
              <div className="vehicle-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeForm() }}>
                <div className="vehicle-modal">
                  <div className="vehicle-modal-header">
                    <div>
                      <div className="tag">{editing ? 'Modifier le véhicule' : 'Nouveau véhicule'}</div>
                    </div>
                    <button className="vehicle-modal-close" onClick={closeForm}>✕</button>
                  </div>

                  <form className="vehicle-modal-form" onSubmit={handleSubmit}>
                    <div className="vmf-row">
                      <div className="vmf-group">
                        <label className="vmf-label">Marque *</label>
                        <input name="brand" className="vmf-input" value={form.brand} onChange={handleChange} required placeholder="Ferrari" />
                      </div>
                      <div className="vmf-group">
                        <label className="vmf-label">Modèle *</label>
                        <input name="model" className="vmf-input" value={form.model} onChange={handleChange} required placeholder="Roma Spider" />
                      </div>
                    </div>

                    <div className="vmf-row">
                      <div className="vmf-group">
                        <label className="vmf-label">Année *</label>
                        <input name="year" type="number" className="vmf-input" value={form.year} onChange={handleChange} required placeholder="2024" />
                      </div>
                      <div className="vmf-group">
                        <label className="vmf-label">Prix (€) *</label>
                        <input name="price" type="number" className="vmf-input" value={form.price} onChange={handleChange} required placeholder="248000" />
                      </div>
                    </div>

                    <div className="vmf-row">
                      <div className="vmf-group">
                        <label className="vmf-label">Carburant *</label>
                        <select name="fuel_type" className="vmf-input" value={form.fuel_type} onChange={handleChange} required>
                          <option value="">Sélectionner</option>
                          <option value="Essence">Essence</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Hybride">Hybride</option>
                          <option value="Électrique">Électrique</option>
                        </select>
                      </div>
                      <div className="vmf-group">
                        <label className="vmf-label">Transmission *</label>
                        <select name="transmission" className="vmf-input" value={form.transmission} onChange={handleChange} required>
                          <option value="">Sélectionner</option>
                          <option value="Automatique">Automatique</option>
                          <option value="Manuelle">Manuelle</option>
                        </select>
                      </div>
                    </div>

                    <div className="vmf-row">
                      <div className="vmf-group">
                        <label className="vmf-label">Kilométrage</label>
                        <input name="mileage" type="number" className="vmf-input" value={form.mileage} onChange={handleChange} placeholder="0" />
                      </div>
                      <div className="vmf-group">
                        <label className="vmf-label">Puissance</label>
                        <input name="power" className="vmf-input" value={form.power} onChange={handleChange} placeholder="620 CH" />
                      </div>
                    </div>

                    <div className="vmf-group">
                      <label className="vmf-label">Statut</label>
                      <select name="status" className="vmf-input" value={form.status} onChange={handleChange}>
                        <option value="available">Disponible</option>
                        <option value="reserved">Réservé</option>
                        <option value="sold">Vendu</option>
                      </select>
                    </div>

                    <div className="vmf-group">
                      <label className="vmf-label">Description</label>
                      <textarea name="description" className="vmf-input vmf-textarea" value={form.description} onChange={handleChange} placeholder="Description du véhicule..." rows={3} />
                    </div>

                    {error && <div className="vmf-error">{error}</div>}
                    {success && <div className="vmf-success">{success}</div>}

                    <div className="vmf-actions">
                      <button type="button" className="btn-ghost" onClick={closeForm}>Annuler</button>
                      <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Ajouter'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
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