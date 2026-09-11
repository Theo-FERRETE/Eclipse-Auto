// Menu latéral du back-office.

import { Link, useLocation } from 'react-router-dom'
import './AdminSidebar.css'

const LINKS = [
  { to: '/admin',               label: 'Dashboard' },
  { to: '/admin/vehicles',      label: 'Véhicules' },
  { to: '/admin/reservations',  label: 'Essais' },
  { to: '/admin/ventes',        label: 'Ventes' },
  { to: '/admin/users',         label: 'Clients' },
  { to: '/admin/equipements',   label: 'Équipements' },
  { to: '/dashboard',           label: 'Espace client' },
]

export default function AdminSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="admin-sidebar">
      <nav className="sidebar-nav">
        {LINKS.map(({ to, label }) => {
          // /admin (Dashboard) doit rester exact, sinon il serait actif sur toutes les
          // sous-routes admin ; les autres liens couvrent aussi leurs sous-pages
          // (ex. /admin/vehicles/new, /admin/vehicles/:id/edit).
          const isActive = to === '/admin'
            ? pathname === to
            : pathname === to || pathname.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              to={to}
              className={`sidebar-link${isActive ? ' active' : ''}`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
