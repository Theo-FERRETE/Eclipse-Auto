// Attrape les erreurs de rendu et affiche un écran de repli. Doit être une classe : les
// hooks ne savent pas le faire.

import { Component } from 'react'
import i18n from '@/lib/i18n'

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
      // i18n.t directement plutôt que le hook (interdit dans une classe) ou withTranslation :
      // cet écran remplace toute l'application, sélecteur de langue compris, il n'a donc
      // jamais à se retraduire une fois affiché.
      return (
        <main style={{ textAlign: 'center', padding: '80px 24px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', textTransform: 'uppercase', marginBottom: '16px' }}>
            {i18n.t('errorBoundary.title')}
          </h1>
          <p style={{ color: 'var(--gray)', marginBottom: '32px' }}>
            {i18n.t('errorBoundary.desc')}
          </p>
          {/* Rechargement complet : l'état de l'app a peut-être causé l'erreur. */}
          <button className="btn-primary" onClick={() => window.location.reload()}>
            {i18n.t('errorBoundary.reload')}
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
