// Écran de confirmation après envoi de la demande d'achat.

import { Link } from 'react-router-dom'

export default function AchatSuccess({ vehicle }) {
  return (
    <main className="reservation-success-page">
      <div className="page-section">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <div className="tag">Confirmation</div>
          <h1 className="success-title">Demande d'achat envoyée !</h1>
          <p className="success-desc">
            Votre demande d'achat pour la <strong>{vehicle.brand} {vehicle.model}</strong> a bien été enregistrée. Notre équipe vous contactera dans les plus brefs délais pour finaliser la transaction.
          </p>
          <p className="success-redirect">
            Redirection vers votre espace client dans 3 secondes...
          </p>
          <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-block', marginTop: '8px' }}>
            Voir mes achats
          </Link>
        </div>
      </div>
    </main>
  )
}
