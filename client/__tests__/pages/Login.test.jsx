import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/lib/auth', () => ({ login: vi.fn() }))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

import Login from '@/pages/Login/Login'
import { login } from '@/lib/auth'

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>)
}

describe('Login — rendu', () => {
  it('affiche le titre Connexion', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
  })

  it('affiche les champs email et mot de passe', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
  })

  it('affiche le bouton Se connecter', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('affiche le lien vers /register', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /s'inscrire/i })).toBeInTheDocument()
  })

  it('affiche le lien mot de passe oublié', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /mot de passe oublié/i })).toBeInTheDocument()
  })
})

describe('Login — formulaire', () => {
  beforeEach(() => vi.clearAllMocks())

  it('met à jour le champ email', () => {
    renderLogin()
    const input = screen.getByLabelText(/email/i)
    fireEvent.change(input, { target: { name: 'email', value: 'test@test.com' } })
    expect(input.value).toBe('test@test.com')
  })

  it('affiche une erreur si login échoue', async () => {
    login.mockRejectedValueOnce(new Error('Invalid credentials'))
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { name: 'email', value: 'x@x.com' } })
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { name: 'password', value: 'wrong' } })
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email ou mot de passe incorrect/i)
    })
  })

  it('le bouton est désactivé pendant le chargement', async () => {
    login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)))
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { name: 'email', value: 'x@x.com' } })
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { name: 'password', value: '123456' } })
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connexion/i })).toBeDisabled()
    })
  })

  it('appelle login avec email et password', async () => {
    login.mockResolvedValueOnce({})
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { name: 'email', value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { name: 'password', value: 'secret123' } })
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form'))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('user@test.com', 'secret123')
    })
  })
})
