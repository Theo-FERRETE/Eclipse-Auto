import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { logout } from '@/lib/auth'
import './Navbar.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">

        <Link to="/" className="navbar-logo">
          <img src="/logo-eclipse.svg" alt="Eclipse Auto" className="navbar-logo-img" />
        </Link>

        <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/catalogue" className={({ isActive }) => isActive ? 'active' : ''}>
            Catalogue
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              Réservations
            </NavLink>
          )}
          <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''}>
            Contact
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active admin-link' : 'admin-link'}>
              Admin
            </NavLink>
          )}
          <div className="navbar-mobile-actions">
            {user ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  className="navbar-username"
                  onClick={() => setMenuOpen(false)}
                >
                  {profile?.first_name || user?.email?.split('@')[0] || 'Mon compte'}
                </Link>
                <button
                  className="btn-ghost"
                  onClick={() => { handleLogout(); setMenuOpen(false) }}
                  style={{ padding: '8px 20px', fontSize: '11px' }}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn-ghost"
                onClick={() => setMenuOpen(false)}
                style={{ padding: '8px 20px', fontSize: '11px' }}
              >
                Connexion
              </Link>
            )}
          </div>
        </nav>

        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user">
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="navbar-username"
              >
                {profile?.first_name || user?.email?.split('@')[0] || 'Mon compte'}
              </Link>
              <button
                className="btn-ghost"
                onClick={handleLogout}
                style={{ padding: '8px 20px', fontSize: '11px' }}
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-ghost"
              style={{ padding: '8px 20px', fontSize: '11px' }}
            >
              Connexion
            </Link>
          )}
        </div>

        <button
          className="navbar-burger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span className={menuOpen ? 'open' : ''} aria-hidden="true"></span>
          <span className={menuOpen ? 'open' : ''} aria-hidden="true"></span>
          <span className={menuOpen ? 'open' : ''} aria-hidden="true"></span>
        </button>

      </div>
    </header>
  )
}