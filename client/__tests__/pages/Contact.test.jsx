import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Contact from '@/pages/Contact/Contact'

function renderContact() {
  return render(<MemoryRouter><Contact /></MemoryRouter>)
}

describe('Contact — rendu', () => {
  it('affiche le titre, les champs du formulaire, le bouton d\'envoi et les infos de contact', () => {
    renderContact()
    expect(screen.getByRole('heading', { name: /^contact$/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Votre message...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /envoyer le message/i })).toBeInTheDocument()
    expect(screen.getByText(/nice/i)).toBeInTheDocument()
  })
})

describe('Contact — formulaire', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche le message de succès après envoi', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    renderContact()
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { name: 'name', value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { name: 'email', value: 'alice@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Votre message...'), { target: { name: 'message', value: 'Bonjour' } })
    fireEvent.submit(screen.getByRole('button', { name: /envoyer le message/i }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText(/message envoyé/i)).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le serveur ou le réseau échoue', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Trop de requêtes.' }),
    })
    const { unmount } = renderContact()
    fireEvent.submit(screen.getByRole('button', { name: /envoyer le message/i }).closest('form'))
    await waitFor(() => {
      expect(screen.getByText(/trop de requêtes/i)).toBeInTheDocument()
    })
    unmount()

    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))
    renderContact()
    fireEvent.submit(screen.getByRole('button', { name: /envoyer le message/i }).closest('form'))
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })
})
