// Connexion. AuthContext met à jour l'interface tout seul derrière.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '@/lib/auth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form.email, form.password)
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch {
      // Une clé, pas un message : l'état survit à un changement de langue.
      setError('auth.loginFailed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/eclipse-auto.svg" alt="Eclipse Auto" className="auth-logo" />
          <div className="tag">{t('auth.memberTag')}</div>
          <h1 className="auth-title">{t('auth.loginTitle')}</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">{t('common.email')}</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="form-input"
              placeholder={t('auth.emailPlaceholder')}
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">{t('common.password')}</label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: '12px' }}>
                {t('auth.forgotLink')}
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="form-error" role="alert">{t(error)}</div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? t('auth.loginPending') : t('auth.loginSubmit')}
          </button>
        </form>

        <div className="auth-footer">
          <span>{t('auth.noAccount')}</span>
          <Link to="/register" className="auth-link">{t('auth.registerLink')}</Link>
        </div>
      </div>

      <div className="auth-bg">
        <div className="auth-bg-line-h"></div>
        <div className="auth-bg-line-v"></div>
      </div>
    </main>
  )
}
