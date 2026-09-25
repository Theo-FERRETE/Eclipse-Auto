// Fil d'Ariane de la réservation. Réutilisé par le parcours achat via `label`.

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function ReservationBreadcrumb({ slug, brand, model, label }) {
  const { t } = useTranslation()

  return (
    <div className="reservation-breadcrumb">
      <div className="page-section">
        <Link to="/catalogue" className="breadcrumb-back">{t('reservation.breadcrumbCatalogue')}</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/vehicles/${slug}`} className="breadcrumb-back">{brand} {model}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{label || t('reservation.breadcrumb')}</span>
      </div>
    </div>
  )
}
