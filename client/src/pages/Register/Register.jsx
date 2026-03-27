import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/lib/auth'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm_password) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)
    try {
      await register(form.email, form.password, form.first_name, form.last_name)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo-eclipse.svg" alt="Eclipse Auto" className="auth-logo" />
          <div className="tag">Espace membre</div>
          <h1 className="auth-title">Inscription</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                name="first_name"
                className="form-input"
                placeholder="John"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input
                type="text"
                name="last_name"
                className="form-input"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="votre@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe</label>
            <input
              type="password"
              name="confirm_password"
              className="form-input"
              placeholder="••••••••"
              value={form.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="form-error">{error}</div>
          )}

          {success && (
            <div className="form-success">
              Compte créé ! Vérifiez votre email puis connectez-vous. Redirection dans 3 secondes...
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={loading || success}
          >
            {loading ? 'Inscription...' : success ? 'Compte créé !' : 'Créer mon compte'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Déjà un compte ?</span>
          <Link to="/login" className="auth-link">Se connecter</Link>
        </div>
      </div>

      <div className="auth-bg">
        <div className="auth-bg-line-h"></div>
        <div className="auth-bg-line-v"></div>
      </div>
    </main>
  )
}