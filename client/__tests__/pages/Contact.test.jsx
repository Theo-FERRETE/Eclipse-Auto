import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Contact from '@/pages/Contact/Contact'

function renderContact() {
  return render(<MemoryRouter><Contact /></MemoryRouter>)
}

describe('Contact — rendu', () => {
  it('affiche le titre Contact', () => {
    renderContact()
    expect(screen.getByRole('heading', { name: /^contact$/i })).toBeInTheDocument()
  })

  it('affiche les champs du formulaire', () => {
    renderContact()
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Votre message...')).toBeInTheDocument()
  })

  it('affiche le bouton d\'envoi', () => {
    renderContact()
    expect(screen.getByRole('button', { name: /envoyer le message/i })).toBeInTheDocument()
  })

  it('affiche les informations de contact (Nice)', () => {
    renderContact()
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

  it('affiche une erreur si le serveur retourne une erreur', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Trop de requêtes.' }),
    })

    renderContact()
    fireEvent.submit(screen.getByRole('button', { name: /envoyer le message/i }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText(/trop de requêtes/i)).toBeInTheDocument()
    })
  })

  it('affiche une erreur réseau si fetch échoue', async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))
    renderContact()

    fireEvent.submit(screen.getByRole('button', { name: /envoyer le message/i }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('appelle fetch avec la bonne URL et méthode POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    renderContact()
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { name: 'name', value: 'Bob' } })
    fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { name: 'email', value: 'bob@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Votre message...'), { target: { name: 'message', value: 'Test' } })
    fireEvent.submit(screen.getByRole('button', { name: /envoyer le message/i }).closest('form'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }))
    })
  })
})
