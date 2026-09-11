// Création / modification d'un véhicule. Page à part (plus une modale) : /admin/vehicles/new
// et /admin/vehicles/:id/edit.

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import AdminPageHeader from '@/components/AdminPageHeader/AdminPageHeader'
import './AdminVehicleForm.css'

const EMPTY_FORM = {
  brand: '', model: '', year: '', price: '',
  fuel_type: '', transmission: '', mileage: '',
  power: '', description: '', status: 'available', image: '',
}

export default function AdminVehicleForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(editing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [imageBroken, setImageBroken] = useState(false)

  useEffect(() => {
    if (!editing) return
    async function fetchVehicle() {
      const { data } = await supabase.from('vehicles').select('*').eq('id', id).single()
      if (!data) { navigate('/admin/vehicles'); return }
      setForm({
        brand: data.brand || '', model: data.model || '', year: data.year || '',
        price: data.price || '', fuel_type: data.fuel_type || '',
        transmission: data.transmission || '', mileage: data.mileage || '',
        power: data.power || '', description: data.description || '',
        status: data.status || 'available', image: data.images?.[0] || '',
      })
      setLoading(false)
    }
    fetchVehicle()
  }, [id, editing, navigate])

  function handleChange(e) {
    if (e.target.name === 'image') setImageBroken(false)
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(editing ? `/api/vehicles/${id}` : '/api/vehicles', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.')

      setSuccess(editing ? 'Modifié avec succès.' : 'Ajouté avec succès.')
      setTimeout(() => navigate('/admin/vehicles'), 1200)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin">
      <AdminPageHeader title={editing ? 'Modifier le véhicule' : 'Nouveau véhicule'} />
      <div className="page-section admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          {loading ? (
            <div className="dashboard-loading"><div className="loader"></div></div>
          ) : (
            <div className="vehicle-form-layout">
              <div className="vehicle-form-media">
                <div className="vehicle-form-image">
                  {form.image && !imageBroken
                    ? <img src={form.image} alt="" onError={() => setImageBroken(true)} />
                    : <div className="vehicle-form-image-empty">Aperçu de l'image</div>
                  }
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="vf-image">URL de l'image</label>
                  <input id="vf-image" name="image" className="form-input" value={form.image} onChange={handleChange} placeholder="https://..." />
                </div>
              </div>

              <form className="vehicle-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="vf-brand">Marque *</label>
                    <input id="vf-brand" name="brand" className="form-input" value={form.brand} onChange={handleChange} required placeholder="Ferrari" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vf-model">Modèle *</label>
                    <input id="vf-model" name="model" className="form-input" value={form.model} onChange={handleChange} required placeholder="Roma Spider" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="vf-year">Année *</label>
                    <input id="vf-year" name="year" type="number" className="form-input" value={form.year} onChange={handleChange} required placeholder="2024" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vf-price">Prix (€) *</label>
                    <input id="vf-price" name="price" type="number" className="form-input" value={form.price} onChange={handleChange} required placeholder="248000" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="vf-fuel">Carburant *</label>
                    <select id="vf-fuel" name="fuel_type" className="form-input" value={form.fuel_type} onChange={handleChange} required>
                      <option value="">Sélectionner</option>
                      <option value="ESSENCE">Essence</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="HYBRIDE">Hybride</option>
                      <option value="ELECTRIQUE">Électrique</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vf-transmission">Transmission *</label>
                    <select id="vf-transmission" name="transmission" className="form-input" value={form.transmission} onChange={handleChange} required>
                      <option value="">Sélectionner</option>
                      <option value="AUTOMATIQUE">Automatique</option>
                      <option value="MANUELLE">Manuelle</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="vf-mileage">Kilométrage</label>
                    <input id="vf-mileage" name="mileage" type="number" className="form-input" value={form.mileage} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vf-power">Puissance</label>
                    <input id="vf-power" name="power" className="form-input" value={form.power} onChange={handleChange} placeholder="620 CH" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vf-status">Statut</label>
                  <select id="vf-status" name="status" className="form-input" value={form.status} onChange={handleChange}>
                    <option value="available">Disponible</option>
                    <option value="reserved">Réservé</option>
                    <option value="sold">Vendu</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vf-description">Description</label>
                  <textarea id="vf-description" name="description" className="form-input form-textarea" value={form.description} onChange={handleChange} placeholder="Description du véhicule..." rows={4} />
                </div>

                {error && <div className="form-error" role="alert">{error}</div>}
                {success && <div className="form-success" role="status">{success}</div>}

                <div className="vehicle-form-actions">
                  <Link to="/admin/vehicles" className="btn-ghost">Annuler</Link>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
