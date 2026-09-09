// Gestion des ventes. Confirmer envoie l'email d'achat ; le passage du véhicule en 'sold' est
// fait par le trigger PostgreSQL mark_vehicle_sold (migration 001), pas ici.

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { VENTE_STATUS, PAYMENT_METHOD_LABELS, optimizeImageUrl, formatPrice } from '@/lib/utils'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import AdminPageHeader from '@/components/AdminPageHeader/AdminPageHeader'
import Pagination from '@/components/Pagination/Pagination'
// Mêmes classes que la gestion des essais (mise en page identique en liste/carte).
import '@/pages/admin/AdminReservations/AdminReservations.css'

const ITEMS_PER_PAGE = 8
const MAX_VENTES = 100 // plafond appliqué par l'API sur le paramètre limit

export default function AdminVentes() {
  const [ventes, setVentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')

  async function fetchVentes() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/ventes/all?limit=${MAX_VENTES}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })

    if (!res.ok) { setError('Impossible de charger les ventes.'); setLoading(false); return }

    const { data } = await res.json()
    setVentes(data || [])
    setError(null)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchVentes() }, [])

  async function handleStatus(id, status) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/ventes/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Impossible de modifier le statut de cette vente.')
      return
    }
    fetchVentes()
  }

  const filtered = filter === 'all'
    ? ventes
    : ventes.filter(v => v.status === filter)

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <main className="admin">
      <AdminPageHeader title="Ventes" />

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
                {f === 'all' ? 'Toutes' : VENTE_STATUS[f]?.label}
                <span className="ar-filter-count">
                  {f === 'all' ? ventes.length : ventes.filter(v => v.status === f).length}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="dashboard-loading"><div className="loader"></div></div>
          ) : (
            <>
              <div className="ar-list">
                {paginated.map(v => (
                  <div className="ar-card" key={v.id}>
                    <div className="ar-img">
                      {v.vehicles?.images?.[0]
                        ? <img
                            src={optimizeImageUrl(v.vehicles.images[0], 200)}
                            alt={`${v.vehicles?.brand} ${v.vehicles?.model}`}
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
                      <div className="vcard-brand">{v.vehicles?.brand}</div>
                      <div className="avc-model">{v.vehicles?.model}</div>
                      <div className="ar-price">{formatPrice(v.prix_final)}</div>
                    </div>

                    <div className="ar-client">
                      <div className="ar-client-name">{v.client_name}</div>
                      <div className="ar-date">
                        Demandé le {new Date(v.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="ar-rdv">
                        Paiement : {PAYMENT_METHOD_LABELS[v.mode_paiement] || v.mode_paiement}
                      </div>
                      {v.equipements?.length > 0 && (
                        <div className="ar-equipements">
                          Options : {v.equipements.map(eq => eq.nom).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="ar-actions">
                      <span className={`reservation-status ${VENTE_STATUS[v.status]?.class}`}>
                        {VENTE_STATUS[v.status]?.label}
                      </span>
                      {v.status === 'pending' && (
                        <>
                          <button className="action-btn edit" onClick={() => handleStatus(v.id, 'confirmed')}>
                            Confirmer
                          </button>
                          <button className="action-btn delete" onClick={() => handleStatus(v.id, 'cancelled')}>
                            Annuler
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="catalogue-empty">
                    <p>Aucune vente trouvée.</p>
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
