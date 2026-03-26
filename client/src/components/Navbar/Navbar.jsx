import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar-inner">

        <Link to="/" className="navbar-logo">
          ECLIPSE<span>.</span>AUTO
        </Link>

        <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/catalogue" className={({ isActive }) => isActive ? 'active' : ''}>
            Catalogue
          </NavLink>
          <NavLink to="/reservations" className={({ isActive }) => isActive ? 'active' : ''}>
            Réservations
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''}>
            Contact
          </NavLink>
        </nav>

        <div className="navbar-actions">
          <Link to="/login" className="btn-ghost" style={{ padding: '8px 20px', fontSize: '11px' }}>
            Connexion
          </Link>
        </div>

        <button
          className="navbar-burger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
        </button>

      </div>
    </header>
  )
}