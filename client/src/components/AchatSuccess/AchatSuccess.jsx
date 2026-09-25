// Écran de confirmation après envoi de la demande d'achat.

import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'

export default function AchatSuccess({ vehicle }) {
  const { t } = useTranslation()

  return (
    <main className="reservation-success-page">
      <div className="page-section">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <div className="tag">{t('reservation.successTag')}</div>
          <h1 className="success-title">{t('achat.successTitle')}</h1>
          <p className="success-desc">
            <Trans
              i18nKey="achat.successDesc"
              values={{ vehicle: `${vehicle.brand} ${vehicle.model}` }}
              components={{ b: <strong /> }}
            />
          </p>
          <p className="success-redirect">
            {t('reservation.successRedirect')}
          </p>
          <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-block', marginTop: '8px' }}>
            {t('achat.successLink')}
          </Link>
        </div>
      </div>
    </main>
  )
}
