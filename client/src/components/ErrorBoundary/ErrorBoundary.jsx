// Attrape les erreurs de rendu et affiche un écran de repli. Doit être une classe : les
// hooks ne savent pas le faire.

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  // Appelée pendant le rendu : doit rester pure, pas de log ni d'appel réseau ici.
  static getDerivedStateFromError() {
    return { hasError: true }
  }

  // Appelée hors rendu : c'est ici qu'on a le droit d'avoir des effets de bord. `info`
  // contient la pile des composants React, plus parlante que la pile JavaScript.
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ textAlign: 'center', padding: '80px 24px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', textTransform: 'uppercase', marginBottom: '16px' }}>
            Erreur inattendue
          </h1>
          <p style={{ color: 'var(--gray)', marginBottom: '32px' }}>
            Une erreur est survenue. Veuillez recharger la page.
          </p>
          {/* Rechargement complet : l'état de l'app a peut-être causé l'erreur. */}
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
