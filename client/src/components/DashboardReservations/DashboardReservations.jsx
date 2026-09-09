// Liste des essais du client. `cancelling` évite le double-clic. Un essai n'affiche ni prix
// ni options (c'est le rôle de la vente) ; un essai terminé propose de concrétiser l'achat.

import { Link } from 'react-router-dom'
import { RESERVATION_STATUS, optimizeImageUrl, toSlug } from '@/lib/utils'

export default function DashboardReservations({ reservations, loading, cancelling, onCancel }) {
  return (
    <>
      <div className="dashboard-section-title">
        <div className="tag">Historique</div>
        <h2 className="section-title" style={{ fontSize: '32px', marginTop: '8px' }}>
          Mes essais
        </h2>
      </div>

      {loading && (
        <div className="dashboard-loading">
          <div className="loader"></div>
        </div>
      )}

      {!loading && reservations.length === 0 && (
        <div className="dashboard-empty">
          <p>Vous n'avez pas encore d'essai.</p>
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
                  ? <img
                      src={optimizeImageUrl(r.vehicles.images[0], 400)}
                      alt={`${r.vehicles.brand} ${r.vehicles.model}`}
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
                  <span className="vcard-brand">{r.vehicles?.brand}</span>
                  <span className="vcard-model" style={{ fontSize: '22px' }}>
                    {r.vehicles?.model}
                  </span>
                </div>
                {r.rdv_date && (
                  <div className="reservation-date">
                    {r.rdv_date_fin && r.rdv_date_fin !== r.rdv_date
                      ? `Du ${new Date(r.rdv_date).toLocaleString('fr-FR')} au ${new Date(r.rdv_date_fin).toLocaleString('fr-FR')}`
                      : `Créneau : ${new Date(r.rdv_date).toLocaleString('fr-FR')}`}
                  </div>
                )}
                {r.message && (
                  <div className="reservation-message">"{r.message}"</div>
                )}
                <div className="reservation-date">
                  Demandé le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div className="reservation-actions">
                <span className={`reservation-status ${RESERVATION_STATUS[r.status]?.class}`}>
                  {RESERVATION_STATUS[r.status]?.label}
                </span>
                {(r.status === 'pending' || r.status === 'confirmed') && (
                  <button
                    className="btn-ghost"
                    style={{ padding: '8px 16px', fontSize: '11px' }}
                    onClick={() => onCancel(r.id, r.status)}
                    disabled={cancelling.has(r.id)}
                  >
                    {cancelling.has(r.id) ? '...' : 'Annuler'}
                  </button>
                )}
                {r.status === 'completed' && r.vehicles && (
                  <Link
                    to={`/achat/${toSlug(r.vehicles.brand, r.vehicles.model)}`}
                    state={{ reservation_id: r.id }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '11px' }}
                  >
                    Concrétiser la vente
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
