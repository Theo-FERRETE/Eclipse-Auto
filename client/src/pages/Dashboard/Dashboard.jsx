import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import './Dashboard.css'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReservations() {
      if (!user) return
      const { data, error } = await supabase
        .from('reservations')
        .select(`*, vehicles(brand, model, images, price)`)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) setReservations(data)
      setLoading(false)
    }
    fetchReservations()
  }, [user])

  const statusLabel = {
    pending: { label: 'En attente', class: 'status-pending' },
    confirmed: { label: 'Confirmée', class: 'status-confirmed' },
    cancelled: { label: 'Annulée', class: 'status-cancelled' },
  }

  async function handleCancel(id) {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (!error) {
      setReservations(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r)
      )
    }
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
            <Link to="/dashboard" className="sidebar-link active">
              Mes réservations
            </Link>
            <Link to="/catalogue" className="sidebar-link">
              Voir le catalogue
            </Link>
          </nav>
        </aside>

        <div className="dashboard-main">
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
                      <div className="reservation-message">
                        "{r.message}"
                      </div>
                    )}
                    <div className="reservation-date">
                      Réservé le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="reservation-actions">
                    <span className={`reservation-status ${statusLabel[r.status]?.class}`}>
                      {statusLabel[r.status]?.label}
                    </span>
                    {r.status === 'pending' && (
                      <button
                        className="btn-ghost"
                        style={{ padding: '8px 16px', fontSize: '11px' }}
                        onClick={() => handleCancel(r.id)}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}