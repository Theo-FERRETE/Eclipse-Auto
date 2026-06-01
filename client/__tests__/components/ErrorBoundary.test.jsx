import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary'

function ThrowError() {
  throw new Error('Crash de test')
}

function SafeChild() {
  return <div>Contenu normal</div>
}

describe('ErrorBoundary', () => {
  let consoleError

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('affiche les enfants quand tout va bien', () => {
    render(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Contenu normal')).toBeInTheDocument()
  })

  it('affiche la page d\'erreur si un enfant crash', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(screen.getByText(/erreur inattendue/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recharger/i })).toBeInTheDocument()
  })

  it('appelle console.error quand une erreur est capturée', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(consoleError).toHaveBeenCalled()
  })

  it('le bouton recharger appelle window.location.reload', () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /recharger/i }))
    expect(reloadMock).toHaveBeenCalled()
  })
})
