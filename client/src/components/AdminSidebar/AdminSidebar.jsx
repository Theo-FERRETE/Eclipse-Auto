// Menu latéral du back-office.

import { Link, useLocation } from 'react-router-dom'
import './AdminSidebar.css'

const LINKS = [
  { to: '/admin',               label: 'Dashboard' },
  { to: '/admin/vehicles',      label: 'Véhicules' },
  { to: '/admin/reservations',  label: 'Réservations' },
  { to: '/admin/users',         label: 'Clients' },
  { to: '/admin/equipements',   label: 'Équipements' },
  { to: '/dashboard',           label: 'Espace client' },
]

export default function AdminSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="admin-sidebar">
      <nav className="sidebar-nav">
        {LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`sidebar-link${pathname === to ? ' active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
