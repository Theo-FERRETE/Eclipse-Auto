// Inscription. Prénom et nom passent en métadonnées Supabase.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { register } from '@/lib/auth'
import '../Login/Login.css'

export default function Register() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  // { key } pour une erreur traduisible, { text } pour un message brut de Supabase :
  // stocker du texte déjà traduit le figerait dans la langue du moment.
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
      setError({ key: 'common.passwordMismatch' })
      return
    }

    if (form.password.length < 6) {
      setError({ key: 'common.passwordTooShort' })
      return
    }

    setLoading(true)
    try {
      await register(form.email, form.password, form.first_name, form.last_name)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message ? { text: err.message } : { key: 'common.errorGeneric' })
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
          <h1 className="auth-title">{t('auth.registerTitle')}</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-firstname">{t('common.firstName')}</label>
              <input
                id="reg-firstname"
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
              <label className="form-label" htmlFor="reg-lastname">{t('common.lastName')}</label>
              <input
                id="reg-lastname"
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
            <label className="form-label" htmlFor="reg-email">{t('common.email')}</label>
            <input
              id="reg-email"
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
            <label className="form-label" htmlFor="reg-password">{t('common.password')}</label>
            <input
              id="reg-password"
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
            <label className="form-label" htmlFor="reg-confirm">{t('common.passwordConfirm')}</label>
            <input
              id="reg-confirm"
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
            <div className="form-error" role="alert">{error.key ? t(error.key) : error.text}</div>
          )}

          {success && (
            <div className="form-success">
              {t('auth.registerSuccess')}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={loading || success}
          >
            {loading ? t('auth.registerPending') : success ? t('auth.registerDone') : t('auth.registerSubmit')}
          </button>
        </form>

        <div className="auth-footer">
          <span>{t('auth.hasAccount')}</span>
          <Link to="/login" className="auth-link">{t('auth.loginLink')}</Link>
        </div>
      </div>

      <div className="auth-bg">
        <div className="auth-bg-line-h"></div>
        <div className="auth-bg-line-v"></div>
      </div>
    </main>
  )
}
