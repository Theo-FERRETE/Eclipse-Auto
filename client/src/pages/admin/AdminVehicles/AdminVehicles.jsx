import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
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
      if (editing) {
        const { error } = await supabase.from('vehicles').update(payload).eq('id', editing)
        if (error) throw error
        setSuccess('Modifié avec succès.')
      } else {
        const { error } = await supabase.from('vehicles').insert(payload)
        if (error) throw error
        setSuccess('Ajouté avec succès.')
      }
      await fetchVehicles()
      setTimeout(() => closeForm(), 1500)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce véhicule ?')) return
    await supabase.from('vehicles').delete().eq('id', id)
    fetchVehicles()
  }

  async function handleStatusChange(id, status) {
    await supabase.from('vehicles').update({ status }).eq('id', id)
    fetchVehicles()
  }

  const filtered = vehicles.filter(v =>
    `${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <main className="admin">
      <div className="admin-hero">
        <div className="container">
          <div className="tag">Administration</div>
          <h1 className="admin-title">Véhicules</h1>
        </div>
      </div>

      <div className="divider"></div>

      <div className="container admin-layout">
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            <Link to="/admin" className="sidebar-link">Dashboard</Link>
            <Link to="/admin/vehicles" className="sidebar-link active">Véhicules</Link>
            <Link to="/admin/reservations" className="sidebar-link">Réservations</Link>
            <Link to="/dashboard" className="sidebar-link">Espace client</Link>
          </nav>
        </aside>

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
                <button className="btn-primary" onClick={openCreate}>
                  + Ajouter
                </button>
              </div>

              {loading ? (
                <div className="dashboard-loading"><div className="loader"></div></div>
              ) : (
                <>
                  <div className="admin-vehicles-list">
                    {paginated.map(v => (
                      <div
                        key={v.id}
                        className={`admin-vehicle-card ${editing === v.id ? 'active' : ''}`}
                      >
                        <div className="avc-img">
                          {v.images?.[0]
                            ? <img src={v.images[0]} alt={`${v.brand} ${v.model}`} />
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
                          <div className="avc-price">
                            € {v.price?.toLocaleString('fr-FR')}
                          </div>
                          <select
                            className="status-select"
                            value={v.status}
                            onChange={e => handleStatusChange(v.id, e.target.value)}
                          >
                            <option value="available">Disponible</option>
                            <option value="reserved">Réservé</option>
                            <option value="sold">Vendu</option>
                          </select>
                          <div className="avc-actions">
                            <button className="action-btn edit" onClick={() => openEdit(v)}>
                              Modifier
                            </button>
                            <button className="action-btn delete" onClick={() => handleDelete(v.id)}>
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filtered.length === 0 && (
                      <div className="catalogue-empty">
                        <p>Aucun véhicule trouvé.</p>
                      </div>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination" style={{ marginTop: '16px' }}>
                      <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>←</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                      ))}
                      <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>→</button>
                    </div>
                  )}
                </>
              )}
            </div>

            {showForm && (
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div className="tag">{editing ? 'Modifier' : 'Nouveau'}</div>
                  <button className="filters-reset" onClick={closeForm}>✕</button>
                </div>

                <form className="admin-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Marque *</label>
                    <input name="brand" className="form-input" value={form.brand} onChange={handleChange} required placeholder="Ferrari" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Modèle *</label>
                    <input name="model" className="form-input" value={form.model} onChange={handleChange} required placeholder="Roma Spider" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Année *</label>
                      <input name="year" type="number" className="form-input" value={form.year} onChange={handleChange} required placeholder="2024" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Prix (€) *</label>
                      <input name="price" type="number" className="form-input" value={form.price} onChange={handleChange} required placeholder="248000" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Carburant *</label>
                      <select name="fuel_type" className="form-input" value={form.fuel_type} onChange={handleChange} required>
                        <option value="">Sélectionner</option>
                        <option value="Essence">Essence</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Hybride">Hybride</option>
                        <option value="Électrique">Électrique</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Transmission *</label>
                      <select name="transmission" className="form-input" value={form.transmission} onChange={handleChange} required>
                        <option value="">Sélectionner</option>
                        <option value="Automatique">Automatique</option>
                        <option value="Manuelle">Manuelle</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Kilométrage</label>
                      <input name="mileage" type="number" className="form-input" value={form.mileage} onChange={handleChange} placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Puissance</label>
                      <input name="power" className="form-input" value={form.power} onChange={handleChange} placeholder="620 CH" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Statut</label>
                    <select name="status" className="form-input" value={form.status} onChange={handleChange}>
                      <option value="available">Disponible</option>
                      <option value="reserved">Réservé</option>
                      <option value="sold">Vendu</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea name="description" className="form-input form-textarea" value={form.description} onChange={handleChange} placeholder="Description..." rows={3} />
                  </div>

                  {error && <div className="form-error">{error}</div>}
                  {success && <div className="form-success">{success}</div>}

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>
                      {submitting ? 'Enregistrement...' : editing ? 'Modifier' : 'Ajouter'}
                    </button>
                    <button type="button" className="btn-ghost" onClick={closeForm}>✕</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}