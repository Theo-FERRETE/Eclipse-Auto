import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import './AdminReservations.css'

const ITEMS_PER_PAGE = 8

export default function AdminReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchReservations() }, [])

  async function fetchReservations() {
    setLoading(true)

    const { data, error } = await supabase
      .from('reservations')
      .select('*, vehicles(brand, model, images, price)')
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    const enriched = await Promise.all(
      (data || []).map(async r => {
        const { data: name } = await supabase
          .rpc('get_profile_name', { profile_id: r.client_id })
        return { ...r, client_name: name || 'Client inconnu' }
      })
    )

    setReservations(enriched)
    setLoading(false)
  }

  async function handleStatus(id, status) {
    await supabase.from('reservations').update({ status }).eq('id', id)
    fetchReservations()
  }

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter)

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const statusConfig = {
    pending: { label: 'En attente', class: 'status-pending' },
    confirmed: { label: 'Confirmée', class: 'status-confirmed' },
    cancelled: { label: 'Annulée', class: 'status-cancelled' },
  }

  return (
    <main className="admin">
      <div className="admin-hero">
        <div className="container">
          <div className="tag">Administration</div>
          <h1 className="admin-title">Réservations</h1>
        </div>
      </div>

      <div className="divider"></div>

      <div className="container admin-layout">
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            <Link to="/admin" className="sidebar-link">Dashboard</Link>
            <Link to="/admin/vehicles" className="sidebar-link">Véhicules</Link>
            <Link to="/admin/reservations" className="sidebar-link active">Réservations</Link>
            <Link to="/admin/users" className="sidebar-link">Clients</Link>
            <Link to="/dashboard" className="sidebar-link">Espace client</Link>
          </nav>
        </aside>

        <div className="admin-content">
          <div className="ar-toolbar">
            {['all', 'pending', 'confirmed', 'cancelled'].map(f => (
              <button
                key={f}
                className={`ar-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => { setFilter(f); setPage(1) }}
              >
                {f === 'all' ? 'Toutes' : statusConfig[f]?.label}
                <span className="ar-filter-count">
                  {f === 'all' ? reservations.length : reservations.filter(r => r.status === f).length}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="dashboard-loading"><div className="loader"></div></div>
          ) : (
            <>
              <div className="ar-list">
                {paginated.map(r => (
                  <div className="ar-card" key={r.id}>
                    <div className="ar-img">
                      {r.vehicles?.images?.[0]
                        ? <img src={r.vehicles.images[0]} alt="" />
                        : <div className="avc-img-placeholder"></div>
                      }
                      <div className="gallery-bar"></div>
                    </div>

                    <div className="ar-vehicle">
                      <div className="vcard-brand">{r.vehicles?.brand}</div>
                      <div className="avc-model">{r.vehicles?.model}</div>
                      <div className="ar-price">
                        € {r.vehicles?.price?.toLocaleString('fr-FR')}
                      </div>
                    </div>

                    <div className="ar-client">
                      <div className="ar-client-name">{r.client_name}</div>
                      <div className="ar-date">
                        Réservé le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      {r.rdv_date && (
                        <div className="ar-rdv">
                          RDV : {new Date(r.rdv_date).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      {r.message && (
                        <div className="ar-message">"{r.message}"</div>
                      )}
                    </div>

                    <div className="ar-actions">
                      <span className={`reservation-status ${statusConfig[r.status]?.class}`}>
                        {statusConfig[r.status]?.label}
                      </span>
                      {r.status === 'pending' && (
                        <>
                          <button className="action-btn edit" onClick={() => handleStatus(r.id, 'confirmed')}>
                            Confirmer
                          </button>
                          <button className="action-btn delete" onClick={() => handleStatus(r.id, 'cancelled')}>
                            Annuler
                          </button>
                        </>
                      )}
                      {r.status === 'confirmed' && (
                        <button className="action-btn delete" onClick={() => handleStatus(r.id, 'cancelled')}>
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="catalogue-empty">
                    <p>Aucune réservation trouvée.</p>
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
      </div>
    </main>
  )
}