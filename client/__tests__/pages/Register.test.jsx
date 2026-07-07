import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/lib/supabase', () => ({ supabase: { auth: { signUp: vi.fn() } } }))
vi.mock('@/lib/auth', () => ({ register: vi.fn() }))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

import Register from '@/pages/Register/Register'
import { register } from '@/lib/auth'

function renderRegister() {
  return render(<MemoryRouter><Register /></MemoryRouter>)
}

describe('Register — rendu', () => {
  it('affiche le titre, tous les champs du formulaire et le lien vers /login', () => {
    renderRegister()
    expect(screen.getByRole('heading', { name: /inscription/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^nom$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmer/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument()
  })
})

describe('Register — validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('valide côté client avant d\'appeler le serveur (mots de passe différents ou trop courts)', async () => {
    const { unmount } = renderRegister()
    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), { target: { name: 'password', value: 'azerty1' } })
    fireEvent.change(screen.getByLabelText(/confirmer/i), { target: { name: 'confirm_password', value: 'azerty2' } })
    fireEvent.submit(screen.getByRole('button', { name: /créer mon compte/i }).closest('form'))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/ne correspondent pas/i)
    })
    expect(register).not.toHaveBeenCalled()
    unmount()

    renderRegister()
    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), { target: { name: 'password', value: '123' } })
    fireEvent.change(screen.getByLabelText(/confirmer/i), { target: { name: 'confirm_password', value: '123' } })
    fireEvent.submit(screen.getByRole('button', { name: /créer mon compte/i }).closest('form'))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/6 caractères/i)
    })
    expect(register).not.toHaveBeenCalled()
  })

  it('affiche le message de succès après inscription', async () => {
    register.mockResolvedValueOnce({})
    renderRegister()

    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { name: 'first_name', value: 'Jean' } })
    fireEvent.change(screen.getByLabelText(/^nom$/i), { target: { name: 'last_name', value: 'Dupont' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { name: 'email', value: 'jean@test.com' } })
    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), { target: { name: 'password', value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirmer/i), { target: { name: 'confirm_password', value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: /créer mon compte/i }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText(/vérifiez votre email/i)).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(register).toHaveBeenCalledWith('jean@test.com', 'password123', 'Jean', 'Dupont')
  })

  it('affiche l\'erreur serveur si register échoue', async () => {
    register.mockRejectedValueOnce(new Error('Email déjà utilisé'))
    renderRegister()

    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), { target: { name: 'password', value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirmer/i), { target: { name: 'confirm_password', value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: /créer mon compte/i }).closest('form'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email déjà utilisé/i)
    })
  })
})
