// Navigation de l'espace client, en pastilles à côté du titre.

import { Link } from 'react-router-dom'

export default function DashboardTabs({ view, onViewChange }) {
  return (
    <div className="dashboard-tabs">
      <button
        type="button"
        className={`tab-pill${view === 'reservations' ? ' active' : ''}`}
        onClick={() => onViewChange('reservations')}
      >
        Mes essais
      </button>
      <button
        type="button"
        className={`tab-pill${view === 'ventes' ? ' active' : ''}`}
        onClick={() => onViewChange('ventes')}
      >
        Mes achats
      </button>
      <button
        type="button"
        className={`tab-pill${view === 'profile' ? ' active' : ''}`}
        onClick={() => onViewChange('profile')}
      >
        Mon profil
      </button>
      <Link to="/catalogue" className="dashboard-tabs-catalogue">
        Voir le catalogue →
      </Link>
    </div>
  )
}
