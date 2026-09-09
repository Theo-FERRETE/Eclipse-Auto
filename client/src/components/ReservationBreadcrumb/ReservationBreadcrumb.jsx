// Fil d'Ariane de la réservation. Réutilisé par le parcours achat via `label`.

import { Link } from 'react-router-dom'

export default function ReservationBreadcrumb({ slug, brand, model, label = 'Réservation' }) {
  return (
    <div className="reservation-breadcrumb">
      <div className="container">
        <Link to="/catalogue" className="breadcrumb-back">← Catalogue</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/vehicles/${slug}`} className="breadcrumb-back">{brand} {model}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{label}</span>
      </div>
    </div>
  )
}
