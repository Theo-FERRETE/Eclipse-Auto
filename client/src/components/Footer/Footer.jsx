// Pied de page.

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  const { t } = useTranslation()

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="page-section footer-grid">
          <div className="footer-brand">
            <img src="/eclipse-auto.svg" alt="Eclipse Auto" className="footer-logo" />
            <p className="footer-desc">
              {t('footer.desc')}
            </p>
          </div>

          <div className="footer-nav">
            <div className="footer-nav-title">{t('footer.navTitle')}</div>
            <Link to="/">{t('footer.home')}</Link>
            <Link to="/catalogue">{t('nav.catalogue')}</Link>
            <Link to="/contact">{t('nav.contact')}</Link>
          </div>

          <div className="footer-nav">
            <div className="footer-nav-title">{t('footer.accountTitle')}</div>
            <Link to="/login">{t('nav.login')}</Link>
            <Link to="/register">{t('footer.register')}</Link>
            <Link to="/dashboard">{t('nav.dashboard')}</Link>
          </div>

          <div className="footer-nav">
            <div className="footer-nav-title">{t('footer.legalTitle')}</div>
            <Link to="/mentions-legales">{t('footer.legalLink')}</Link>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <div className="footer-bottom">
        <div className="page-section footer-bottom-inner">
          <div className="footer-copy">
            {t('footer.copy', { year })}
          </div>
          <div className="footer-credits">
            <span className="footer-credit-item">
              {t('footer.creditEducational')}
            </span>
            <span className="footer-sep">·</span>
            <span className="footer-credit-item">
              {t('footer.creditAuthor')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
