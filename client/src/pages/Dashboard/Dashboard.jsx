import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { RESERVATION_STATUS } from '@/lib/utils'
import './Dashboard.css'

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const [view, setView] = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(new Set())

  // Profile form state
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  // Password form state
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  useEffect(() => {
    async function fetchReservations() {
      if (!user) return
      const { data, error } = await supabase
        .from('reservations')
        .select('*, vehicles(brand, model, images, price)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) setReservations(data || [])
      setLoading(false)
    }
    fetchReservations()
  }, [user])

  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      })
    }
  }, [profile])


  async function handleCancel(id) {
    if (cancelling.has(id)) return
    setCancelling(prev => new Set(prev).add(id))

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (!error) {
      setReservations(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r)
      )
    }

    setCancelling(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  async function handleProfileSave(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone,
      })
      .eq('id', user.id)

    if (error) {
      setProfileMsg({ type: 'error', text: 'Erreur lors de la sauvegarde.' })
    } else {
      await refreshProfile()
      setProfileMsg({ type: 'success', text: 'Profil mis à jour.' })
    }
    setProfileSaving(false)
  }

  async function handlePasswordSave(e) {
    e.preventDefault()
    if (pwForm.password !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (pwForm.password.length < 6) {
      setPwMsg({ type: 'error', text: 'Le mot de passe doit faire au moins 6 caractères.' })
      return
    }
    setPwSaving(true)
    setPwMsg(null)

    const { error } = await supabase.auth.updateUser({ password: pwForm.password })

    if (error) {
      setPwMsg({ type: 'error', text: error.message })
    } else {
      setPwMsg({ type: 'success', text: 'Mot de passe mis à jour.' })
      setPwForm({ password: '', confirm: '' })
    }
    setPwSaving(false)
  }

  return (
    <main className="dashboard">
      <div className="dashboard-hero">
        <div className="container">
          <div className="tag">Espace personnel</div>
          <h1 className="dashboard-title">
            Bonjour, <em>{profile?.first_name || 'Client'}</em>
          </h1>
        </div>
      </div>

      <div className="divider"></div>

      <div className="container dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div className="profile-info">
              <div className="profile-name">
                {profile?.first_name} {profile?.last_name}
              </div>
              <div className="profile-email">{user?.email}</div>
              <div className="profile-role">
                <span className="badge-available">{profile?.role || 'client'}</span>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-link ${view === 'reservations' ? 'active' : ''}`}
              onClick={() => setView('reservations')}
            >
              Mes réservations
            </button>
            <button
              className={`sidebar-link ${view === 'profile' ? 'active' : ''}`}
              onClick={() => setView('profile')}
            >
              Mon profil
            </button>
            <Link to="/catalogue" className="sidebar-link">
              Voir le catalogue
            </Link>
          </nav>
        </aside>

        <div className="dashboard-main">

          {view === 'reservations' && (
            <>
              <div className="dashboard-section-title">
                <div className="tag">Historique</div>
                <h2 className="section-title" style={{ fontSize: '32px', marginTop: '8px' }}>
                  Mes réservations
                </h2>
              </div>

              {loading && (
                <div className="dashboard-loading">
                  <div className="loader"></div>
                </div>
              )}

              {!loading && reservations.length === 0 && (
                <div className="dashboard-empty">
                  <p>Vous n'avez pas encore de réservation.</p>
                  <Link to="/catalogue" className="btn-primary">
                    Découvrir le catalogue
                  </Link>
                </div>
              )}

              {!loading && reservations.length > 0 && (
                <div className="reservations-list">
                  {reservations.map(r => (
                    <div className="reservation-card" key={r.id}>
                      <div className="reservation-img">
                        {r.vehicles?.images?.[0]
                          ? <img src={r.vehicles.images[0]} alt={`${r.vehicles.brand} ${r.vehicles.model}`} />
                          : <div className="reservation-img-placeholder"></div>
                        }
                      </div>
                      <div className="reservation-info">
                        <div className="reservation-vehicle">
                          <span className="vcard-brand">{r.vehicles?.brand}</span>
                          <span className="vcard-model" style={{ fontSize: '22px' }}>
                            {r.vehicles?.model}
                          </span>
                        </div>
                        <div className="reservation-price">
                          € {r.vehicles?.price?.toLocaleString('fr-FR')}
                        </div>
                        {r.message && (
                          <div className="reservation-message">"{r.message}"</div>
                        )}
                        <div className="reservation-date">
                          Réservé le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="reservation-actions">
                        <span className={`reservation-status ${RESERVATION_STATUS[r.status]?.class}`}>
                          {RESERVATION_STATUS[r.status]?.label}
                        </span>
                        {r.status === 'pending' && (
                          <button
                            className="btn-ghost"
                            style={{ padding: '8px 16px', fontSize: '11px' }}
                            onClick={() => handleCancel(r.id)}
                            disabled={cancelling.has(r.id)}
                          >
                            {cancelling.has(r.id) ? '...' : 'Annuler'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {view === 'profile' && (
            <>
              <div className="dashboard-section-title">
                <div className="tag">Paramètres</div>
                <h2 className="section-title" style={{ fontSize: '32px', marginTop: '8px' }}>
                  Mon profil
                </h2>
              </div>

              <form className="profile-form" onSubmit={handleProfileSave}>
                <div className="profile-form-title">Informations personnelles</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prénom</label>
                    <input
                      className="form-input"
                      value={profileForm.first_name}
                      onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                      placeholder="Prénom"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nom</label>
                    <input
                      className="form-input"
                      value={profileForm.last_name}
                      onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                      placeholder="Nom"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input
                    className="form-input"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+33 6 00 00 00 00"
                    type="tel"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    value={user?.email || ''}
                    disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  />
                </div>
                {profileMsg && (
                  <div className={profileMsg.type === 'error' ? 'form-error' : 'form-success'}>
                    {profileMsg.text}
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={profileSaving}>
                  {profileSaving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </form>

              <form className="profile-form" onSubmit={handlePasswordSave}>
                <div className="profile-form-title">Changer le mot de passe</div>
                <div className="form-group">
                  <label className="form-label">Nouveau mot de passe</label>
                  <input
                    className="form-input"
                    type="password"
                    value={pwForm.password}
                    onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="6 caractères minimum"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmer le mot de passe</label>
                  <input
                    className="form-input"
                    type="password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Répéter le mot de passe"
                  />
                </div>
                {pwMsg && (
                  <div className={pwMsg.type === 'error' ? 'form-error' : 'form-success'}>
                    {pwMsg.text}
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={pwSaving}>
                  {pwSaving ? 'Mise à jour...' : 'Changer le mot de passe'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </main>
  )
}
