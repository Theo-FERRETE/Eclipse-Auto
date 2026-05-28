import { Link } from 'react-router-dom'

export default function ReservationSuccess({ vehicle }) {
  return (
    <main className="reservation-success-page">
      <div className="container">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <div className="tag">Confirmation</div>
          <h1 className="success-title">Réservation envoyée !</h1>
          <p className="success-desc">
            Votre demande de réservation pour la <strong>{vehicle.brand} {vehicle.model}</strong> a bien été enregistrée. Notre équipe vous contactera dans les plus brefs délais.
          </p>
          <p className="success-redirect">
            Redirection vers votre espace client dans 3 secondes...
          </p>
          <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-block', marginTop: '8px' }}>
            Voir mes réservations
          </Link>
        </div>
      </div>
    </main>
  )
}
