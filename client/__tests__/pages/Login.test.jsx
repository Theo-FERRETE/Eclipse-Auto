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
  it('affiche le titre, les champs, le bouton et les liens de navigation', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /s'inscrire/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /mot de passe oublié/i })).toBeInTheDocument()
  })
})

describe('Login — formulaire', () => {
  beforeEach(() => vi.clearAllMocks())

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

  it('désactive le bouton pendant le chargement', async () => {
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
