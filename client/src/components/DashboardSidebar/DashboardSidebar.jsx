import { Link } from 'react-router-dom'

export default function DashboardSidebar({ profile, user, view, onViewChange }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {profile?.first_name?.[0]}{profile?.last_name?.[0]}
        </div>
        <div className="profile-info">
          <div className="profile-name">
            {profile?.first_name} {profile?.last_name}
          </div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-role">
            <span className="badge-available">{profile?.role || 'client'}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-link ${view === 'reservations' ? 'active' : ''}`}
          onClick={() => onViewChange('reservations')}
        >
          Mes réservations
        </button>
        <button
          className={`sidebar-link ${view === 'profile' ? 'active' : ''}`}
          onClick={() => onViewChange('profile')}
        >
          Mon profil
        </button>
        <Link to="/catalogue" className="sidebar-link">
          Voir le catalogue
        </Link>
      </nav>
    </aside>
  )
}
