// Liste des essais du client. `cancelling` évite le double-clic. Un essai n'affiche ni prix
// ni options (c'est le rôle de la vente) ; un essai terminé propose de concrétiser l'achat.

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RESERVATION_STATUS, optimizeImageUrl, toSlug, formatDate, formatDateTime } from '@/lib/utils'

export default function DashboardReservations({ reservations, loading, cancelling, onCancel }) {
  const { t } = useTranslation()

  return (
    <>
      <div className="dashboard-section-title">
        <div className="tag">{t('dashboard.historyTag')}</div>
        <h2 className="section-title" style={{ fontSize: '32px', marginTop: '8px' }}>
          {t('dashboard.tabReservations')}
        </h2>
      </div>

      {loading && (
        <div className="dashboard-loading">
          <div className="loader"></div>
        </div>
      )}

      {!loading && reservations.length === 0 && (
        <div className="dashboard-empty">
          <p>{t('dashboard.noReservations')}</p>
          <Link to="/catalogue" className="btn-primary">
            {t('dashboard.discoverCatalogue')}
          </Link>
        </div>
      )}

      {!loading && reservations.length > 0 && (
        <div className="card-grid">
          {reservations.map(r => (
            <div className="vcard dashboard-card" key={r.id}>
              <div className="vcard-img">
                {r.vehicles?.images?.[0]
                  ? <img
                      src={optimizeImageUrl(r.vehicles.images[0], 400)}
                      alt={`${r.vehicles.brand} ${r.vehicles.model}`}
                      loading="lazy"
                      decoding="async"
                      style={{ opacity: 0, transition: 'opacity 0.4s ease' }}
                      onLoad={e => { e.currentTarget.style.opacity = '1' }}
                    />
                  : <div className="vcard-img-placeholder"></div>
                }
                {/* RESERVATION_STATUS ne sert plus qu'à la classe CSS : le libellé vient
                    des traductions (status.reservation.*). */}
                <span className={`reservation-status vcard-badge ${RESERVATION_STATUS[r.status]?.class}`}>
                  {t(`status.reservation.${r.status}`)}
                </span>
              </div>

              <div className="vcard-body">
                <div className="vcard-brand">{r.vehicles?.brand}</div>
                <div className="vcard-model">{r.vehicles?.model}</div>
                {r.rdv_date && (
                  <div className="dashboard-card-meta">
                    {r.rdv_date_fin && r.rdv_date_fin !== r.rdv_date
                      ? t('dashboard.dateRange', {
                          start: formatDate(r.rdv_date),
                          end: formatDate(r.rdv_date_fin),
                        })
                      : t('dashboard.slot', { date: formatDateTime(r.rdv_date) })}
                  </div>
                )}
                {r.message && <div className="dashboard-card-meta dashboard-card-message">"{r.message}"</div>}

                {(r.status === 'pending' || r.status === 'confirmed' || (r.status === 'completed' && r.vehicles)) && (
                  <div className="vcard-footer">
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <button
                        className="btn-text"
                        onClick={() => onCancel(r.id, r.status)}
                        disabled={cancelling.has(r.id)}
                      >
                        {cancelling.has(r.id) ? '...' : t('common.cancel')}
                      </button>
                    )}
                    {r.status === 'completed' && r.vehicles && (
                      <Link
                        to={`/achat/${toSlug(r.vehicles.brand, r.vehicles.model)}`}
                        state={{ reservation_id: r.id }}
                        className="btn-primary dashboard-card-cta"
                      >
                        {t('dashboard.completeSale')}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
