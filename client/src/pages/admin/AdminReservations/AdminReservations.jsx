import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { RESERVATION_STATUS } from '@/lib/utils'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import Pagination from '@/components/Pagination/Pagination'
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

    const rows = data || []
    const clientIds = [...new Set(rows.map(r => r.client_id).filter(Boolean))]

    const { data: profiles } = clientIds.length
      ? await supabase.from('profiles').select('id, first_name, last_name').in('id', clientIds)
      : { data: [] }

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))

    const enriched = rows.map(r => {
      const p = profileMap[r.client_id]
      const client_name = p
        ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Client inconnu'
        : 'Client inconnu'
      return { ...r, client_name }
    })

    setReservations(enriched)
    setLoading(false)
  }

  async function handleStatus(id, status) {
    // Le trigger PostgreSQL sync_vehicle_status_on_reservation
    // met à jour vehicles.status automatiquement côté DB
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
    if (error) { console.error(error); return }
    fetchReservations()
  }

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter)

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)


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
        <AdminSidebar />

        <div className="admin-content">
          <div className="ar-toolbar">
            {['all', 'pending', 'confirmed', 'cancelled'].map(f => (
              <button
                key={f}
                className={`ar-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => { setFilter(f); setPage(1) }}
              >
                {f === 'all' ? 'Toutes' : RESERVATION_STATUS[f]?.label}
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
                      <span className={`reservation-status ${RESERVATION_STATUS[r.status]?.class}`}>
                        {RESERVATION_STATUS[r.status]?.label}
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

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}