import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <main className="notfound">
      <div className="notfound-inner">
        <div className="notfound-code">404</div>
        <div className="tag">Erreur</div>
        <h1 className="notfound-title">Page introuvable</h1>
        <p className="notfound-sub">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">Retour à l'accueil</Link>
          <Link to="/catalogue" className="btn-ghost">Voir le catalogue</Link>
        </div>
      </div>
    </main>
  )
}
