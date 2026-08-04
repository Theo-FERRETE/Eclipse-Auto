// Gestion des réservations. Confirmer envoie l'email et passe le véhicule en réservé.

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { RESERVATION_STATUS, optimizeImageUrl, formatPrice } from '@/lib/utils'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import AdminPageHeader from '@/components/AdminPageHeader/AdminPageHeader'
import Pagination from '@/components/Pagination/Pagination'
import './AdminReservations.css'

const ITEMS_PER_PAGE = 8
const MAX_RESERVATIONS = 100 // plafond appliqué par l'API sur le paramètre limit

export default function AdminReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')

  // Passe par l'API, qui renvoie déjà client_name et les équipements liés.
  // Le select Supabase direct qu'on utilisait avant n'incluait pas la table de
  // jointure : les équipements demandés n'étaient jamais affichés.
  async function fetchReservations() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/reservations/all?limit=${MAX_RESERVATIONS}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })

    if (!res.ok) { setError('Impossible de charger les réservations.'); setLoading(false); return }

    const { data } = await res.json()
    setReservations(data || [])
    setError(null)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReservations() }, [])

  async function handleStatus(id, status) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { setError('Impossible de modifier le statut de cette réservation.'); return }
    fetchReservations()
  }

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter)

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)


  return (
    <main className="admin">
      <AdminPageHeader title="Réservations" />

      <div className="container admin-layout">
        <AdminSidebar />

        <div className="admin-content">
          {error && (
            <div className="form-error" role="alert" style={{ marginBottom: '16px' }}>{error}</div>
          )}
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
                        ? <img
                            src={optimizeImageUrl(r.vehicles.images[0], 200)}
                            alt={`${r.vehicles?.brand} ${r.vehicles?.model}`}
                            loading="lazy"
                            decoding="async"
                            style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                            onLoad={e => { e.currentTarget.style.opacity = '1' }}
                          />
                        : <div className="avc-img-placeholder"></div>
                      }
                      <div className="gallery-bar"></div>
                    </div>

                    <div className="ar-vehicle">
                      <div className="vcard-brand">{r.vehicles?.brand}</div>
                      <div className="avc-model">{r.vehicles?.model}</div>
                      <div className="ar-price">{formatPrice(r.vehicles?.price)}</div>
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
                      {r.equipements?.length > 0 && (
                        <div className="ar-equipements">
                          Équipements demandés : {r.equipements.map(eq => eq.nom).join(', ')}
                        </div>
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