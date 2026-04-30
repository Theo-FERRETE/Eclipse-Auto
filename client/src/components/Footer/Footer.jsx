import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img src="/logo-eclipse.svg" alt="Eclipse Auto" className="footer-logo" />
            <p className="footer-desc">
              Concession automobile de sport haut de gamme. Sélection exclusive de véhicules d'exception disponibles à la réservation en ligne.
            </p>
          </div>

          <div className="footer-nav">
            <div className="footer-nav-title">Navigation</div>
            <Link to="/">Accueil</Link>
            <Link to="/catalogue">Catalogue</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div className="footer-nav">
            <div className="footer-nav-title">Compte</div>
            <Link to="/login">Connexion</Link>
            <Link to="/register">Inscription</Link>
            <Link to="/dashboard">Mon espace</Link>
          </div>

          <div className="footer-nav">
            <div className="footer-nav-title">Légal</div>
            <Link to="/mentions-legales">Mentions légales</Link>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <div className="footer-copy">
            © {year} Eclipse Auto — Projet DWWM. Tous droits réservés.
          </div>
          <div className="footer-credits">
            <span className="footer-credit-item">
              Images : <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
            </span>
            <span className="footer-sep">·</span>
            <span className="footer-credit-item">
              Projet éducatif — aucune transaction réelle
            </span>
            <span className="footer-sep">·</span>
            <span className="footer-credit-item">
              Développé par Théo Ferreté
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}