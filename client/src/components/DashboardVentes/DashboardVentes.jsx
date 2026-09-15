// Liste des achats du client. La confirmation reste une action admin (PATCH
// /api/ventes/:id/status), mais le client peut annuler lui-même un achat encore en attente
// (PATCH /api/ventes/:id/cancel) : au-delà, le véhicule est déjà marqué vendu, c'est à l'admin
// de traiter l'annulation.

import { Link } from 'react-router-dom'
import { VENTE_STATUS, PAYMENT_METHOD_LABELS, optimizeImageUrl, formatPrice } from '@/lib/utils'

export default function DashboardVentes({ ventes, loading, cancelling, onCancel }) {
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
        <div className="card-grid">
          {ventes.map(v => (
            <div className="vcard dashboard-card" key={v.id}>
              <div className="vcard-img">
                {v.vehicles?.images?.[0]
                  ? <img
                      src={optimizeImageUrl(v.vehicles.images[0], 400)}
                      alt={`${v.vehicles.brand} ${v.vehicles.model}`}
                      loading="lazy"
                      decoding="async"
                      style={{ opacity: 0, transition: 'opacity 0.4s ease' }}
                      onLoad={e => { e.currentTarget.style.opacity = '1' }}
                    />
                  : <div className="vcard-img-placeholder"></div>
                }
                <span className={`reservation-status vcard-badge ${VENTE_STATUS[v.status]?.class}`}>
                  {VENTE_STATUS[v.status]?.label}
                </span>
              </div>

              <div className="vcard-body">
                <div className="vcard-brand">{v.vehicles?.brand}</div>
                <div className="vcard-model">{v.vehicles?.model}</div>
                {v.equipements?.length > 0 && (
                  <div className="dashboard-card-meta">
                    Options : {v.equipements.map(eq => eq.nom).join(', ')}
                  </div>
                )}
                <div className="dashboard-card-meta">
                  Paiement : {PAYMENT_METHOD_LABELS[v.mode_paiement] || v.mode_paiement}
                </div>

                <div className="vcard-footer">
                  <span className="dashboard-card-price">{formatPrice(v.prix_final)}</span>
                  {v.status === 'pending' && (
                    <button
                      className="btn-text"
                      onClick={() => onCancel(v.id)}
                      disabled={cancelling.has(v.id)}
                    >
                      {cancelling.has(v.id) ? '...' : 'Annuler'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
