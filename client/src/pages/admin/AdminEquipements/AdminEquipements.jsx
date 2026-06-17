import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import AdminPageHeader from '@/components/AdminPageHeader/AdminPageHeader'
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import './AdminEquipements.css'

const EMPTY_FORM = { nom: '', categorie: '', prix_supplement: '' }

export default function AdminEquipements() {
  const [equipements, setEquipements] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchEquipements() }, [])

  async function fetchEquipements() {
    setLoading(true)
    const res = await fetch('/api/equipements')
    const data = await res.json()
    setEquipements(data || [])
    setLoading(false)
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function openEdit(eq) {
    setEditing(eq.id)
    setForm({ nom: eq.nom, categorie: eq.categorie || '', prix_supplement: eq.prix_supplement })
    setError(null)
  }

  function resetForm() {
    setEditing(null); setForm(EMPTY_FORM); setError(null)
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setSubmitting(true)
    try {
      const token = await getToken()
      const res = await fetch(editing ? `/api/equipements/${editing}` : '/api/equipements', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.')
      resetForm()
      await fetchEquipements()
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    const token = await getToken()
    await fetch(`/api/equipements/${confirmId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    setConfirmId(null)
    fetchEquipements()
  }

  return (
    <main className="admin">
      <AdminPageHeader title="Équipements" />
      <div className="container admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-equip-wrap">
            <form className="equip-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="eq-nom">Nom *</label>
                  <input id="eq-nom" name="nom" className="form-input" value={form.nom} onChange={handleChange} required placeholder="Pack Sport" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="eq-categorie">Catégorie</label>
                  <input id="eq-categorie" name="categorie" className="form-input" value={form.categorie} onChange={handleChange} placeholder="Esthétique" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="eq-prix">Supplément (€) *</label>
                  <input id="eq-prix" name="prix_supplement" type="number" className="form-input" value={form.prix_supplement} onChange={handleChange} required placeholder="500" />
                </div>
                <div className="form-group equip-form-actions">
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? '...' : editing ? 'Enregistrer' : '+ Ajouter'}
                  </button>
                  {editing && (
                    <button type="button" className="btn-ghost" onClick={resetForm}>Annuler</button>
                  )}
                </div>
              </div>
              {error && <div className="form-error" role="alert">{error}</div>}
            </form>

            {loading ? (
              <div className="dashboard-loading"><div className="loader"></div></div>
            ) : (
              <div className="equip-list">
                {equipements.map(eq => (
                  <div className="equip-card" key={eq.id}>
                    <div className="equip-info">
                      <div className="equip-name">{eq.nom}</div>
                      {eq.categorie && <div className="equip-categorie">{eq.categorie}</div>}
                    </div>
                    <div className="equip-price">+{Number(eq.prix_supplement).toLocaleString('fr-FR')} €</div>
                    <div className="equip-actions">
                      <button className="action-btn edit" onClick={() => openEdit(eq)}>Modifier</button>
                      <button className="action-btn delete" onClick={() => setConfirmId(eq.id)}>Supprimer</button>
                    </div>
                  </div>
                ))}
                {equipements.length === 0 && (
                  <div className="catalogue-empty"><p>Aucun équipement dans le catalogue.</p></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {confirmId && (
        <ConfirmModal
          message="Supprimer cet équipement définitivement ?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </main>
  )
}
