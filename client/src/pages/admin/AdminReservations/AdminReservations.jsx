// Gestion des essais (RDV). Confirmer envoie l'email et passe le véhicule en réservé ; un
// essai terminé libère le véhicule et propose de concrétiser la vente. Aucune notion de prix
// ni d'options ici : c'est le rôle d'AdminVentes.

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { RESERVATION_STATUS, optimizeImageUrl } from '@/lib/utils'
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

  // Passe par l'API, qui renvoie déjà client_name (résolu côté serveur, pas de FK directe
  // vers profiles).
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
      <AdminPageHeader title="Essais" />

      <div className="container admin-layout">
        <AdminSidebar />

        <div className="admin-content">
          {error && (
            <div className="form-error" role="alert" style={{ marginBottom: '16px' }}>{error}</div>
          )}
          <div className="ar-toolbar">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
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
                    </div>

                    <div className="ar-client">
                      <div className="ar-client-name">{r.client_name}</div>
                      <div className="ar-date">
                        Demandé le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      {r.rdv_date && (
                        <div className="ar-rdv">
                          {r.rdv_date_fin && r.rdv_date_fin !== r.rdv_date
                            ? `Du ${new Date(r.rdv_date).toLocaleString('fr-FR')} au ${new Date(r.rdv_date_fin).toLocaleString('fr-FR')}`
                            : `RDV : ${new Date(r.rdv_date).toLocaleString('fr-FR')}`}
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
                        <>
                          <button className="action-btn edit" onClick={() => handleStatus(r.id, 'completed')}>
                            Marquer terminé
                          </button>
                          <button className="action-btn delete" onClick={() => handleStatus(r.id, 'cancelled')}>
                            Annuler
                          </button>
                        </>
                      )}
                      {r.status === 'completed' && (
                        <span className="ar-message" style={{ fontStyle: 'normal' }}>
                          Le client peut concrétiser l'achat depuis son espace.
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="catalogue-empty">
                    <p>Aucun essai trouvé.</p>
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