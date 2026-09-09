// Liste des achats du client. Lecture seule : la confirmation/annulation d'une vente est
// une action admin (PATCH /api/ventes/:id/status, requireAdmin).

import { Link } from 'react-router-dom'
import { VENTE_STATUS, PAYMENT_METHOD_LABELS, optimizeImageUrl, formatPrice } from '@/lib/utils'

export default function DashboardVentes({ ventes, loading }) {
  return (
    <>
      <div className="dashboard-section-title">
        <div className="tag">Historique</div>
        <h2 className="section-title" style={{ fontSize: '32px', marginTop: '8px' }}>
          Mes achats
        </h2>
      </div>

      {loading && (
        <div className="dashboard-loading">
          <div className="loader"></div>
        </div>
      )}

      {!loading && ventes.length === 0 && (
        <div className="dashboard-empty">
          <p>Vous n'avez pas encore d'achat.</p>
          <Link to="/catalogue" className="btn-primary">
            Découvrir le catalogue
          </Link>
        </div>
      )}

      {!loading && ventes.length > 0 && (
        <div className="reservations-list">
          {ventes.map(v => (
            <div className="reservation-card" key={v.id}>
              <div className="reservation-img">
                {v.vehicles?.images?.[0]
                  ? <img
                      src={optimizeImageUrl(v.vehicles.images[0], 400)}
                      alt={`${v.vehicles.brand} ${v.vehicles.model}`}
                      loading="lazy"
                      decoding="async"
                      style={{ opacity: 0, transition: 'opacity 0.4s ease' }}
                      onLoad={e => { e.currentTarget.style.opacity = '1' }}
                    />
                  : <div className="reservation-img-placeholder"></div>
                }
              </div>
              <div className="reservation-info">
                <div className="reservation-vehicle-info">
                  <span className="vcard-brand">{v.vehicles?.brand}</span>
                  <span className="vcard-model" style={{ fontSize: '22px' }}>
                    {v.vehicles?.model}
                  </span>
                </div>
                <div className="reservation-price">{formatPrice(v.prix_final)}</div>
                {v.equipements?.length > 0 && (
                  <div className="reservation-message">
                    Options : {v.equipements.map(eq => eq.nom).join(', ')}
                  </div>
                )}
                <div className="reservation-message">
                  Paiement : {PAYMENT_METHOD_LABELS[v.mode_paiement] || v.mode_paiement}
                </div>
                <div className="reservation-date">
                  Demandé le {new Date(v.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div className="reservation-actions">
                <span className={`reservation-status ${VENTE_STATUS[v.status]?.class}`}>
                  {VENTE_STATUS[v.status]?.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
