import { Link } from 'react-router-dom'
import './AdminReservations.css'

export default function AdminReservations() {
  return (
    <main className="admin">
      <div className="admin-hero">
        <div className="container">
          <div className="tag">Administration</div>
          <h1 className="admin-title">Réservations</h1>
        </div>
      </div>
      <div className="divider"></div>
      <div className="container admin-layout">
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            <Link to="/admin" className="sidebar-link">Dashboard</Link>
            <Link to="/admin/vehicles" className="sidebar-link">Véhicules</Link>
            <Link to="/admin/reservations" className="sidebar-link active">Réservations</Link>
            <Link to="/dashboard" className="sidebar-link">Espace client</Link>
          </nav>
        </aside>
        <div className="admin-main">
          <p style={{ color: 'var(--gray)' }}>En cours de développement...</p>
        </div>
      </div>
    </main>
  )
}