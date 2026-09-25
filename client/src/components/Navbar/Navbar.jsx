// Navigation. Le lien Admin n'apparaît que si isAdmin — affichage seulement.

import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/AuthContext'
import { logout } from '@/lib/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher'
import './Navbar.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner page-section">

        <Link to="/" className="navbar-logo">
          <img src="/eclipse-auto.svg" alt="Eclipse Auto" className="navbar-logo-img" />
        </Link>

        <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/catalogue" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.catalogue')}
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('nav.dashboard')}
            </NavLink>
          )}
          <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.contact')}
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active admin-link' : 'admin-link'}>
              {t('nav.admin')}
            </NavLink>
          )}
          <div className="navbar-mobile-actions">
            <LanguageSwitcher />
            {user ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  className="navbar-username"
                  onClick={() => setMenuOpen(false)}
                >
                  {profile?.first_name || user?.email?.split('@')[0] || t('nav.account')}
                </Link>
                <button
                  className="btn-ghost"
                  onClick={() => { handleLogout(); setMenuOpen(false) }}
                  style={{ padding: '8px 20px', fontSize: '11px' }}
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn-ghost"
                onClick={() => setMenuOpen(false)}
                style={{ padding: '8px 20px', fontSize: '11px' }}
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </nav>

        <div className="navbar-actions">
          <LanguageSwitcher />
          {user ? (
            <div className="navbar-user">
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="navbar-username"
              >
                {profile?.first_name || user?.email?.split('@')[0] || t('nav.account')}
              </Link>
              <button
                className="btn-ghost"
                onClick={handleLogout}
                style={{ padding: '8px 20px', fontSize: '11px' }}
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-ghost"
              style={{ padding: '8px 20px', fontSize: '11px' }}
            >
              {t('nav.login')}
            </Link>
          )}
        </div>

        <button
          className="navbar-burger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={t('nav.menu')}
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
