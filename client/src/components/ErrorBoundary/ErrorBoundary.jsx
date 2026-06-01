import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

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
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
