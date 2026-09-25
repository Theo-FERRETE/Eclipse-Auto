// Nouveau mot de passe, après clic sur le lien reçu par email.

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import '../Login/Login.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  // { key } pour une erreur traduisible, { text } pour un message brut de Supabase.
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase émet PASSWORD_RECOVERY quand l'utilisateur arrive depuis le lien email
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError({ key: 'common.passwordMismatch' })
      return
    }
    if (form.password.length < 6) {
      setError({ key: 'common.passwordTooShort' })
      return
    }
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: form.password })
    if (error) {
      setError({ text: error.message })
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    }
    setLoading(false)
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/eclipse-auto.svg" alt="Eclipse Auto" className="auth-logo" />
          <div className="tag">{t('auth.memberTag')}</div>
          <h1 className="auth-title">{t('auth.resetTitle')}</h1>
        </div>

        {success ? (
          <div className="form-success">
            <Trans i18nKey="auth.resetSuccess" components={{ br: <br /> }} />
          </div>
        ) : !ready ? (
          <>
            <div className="form-error">
              {t('auth.resetInvalidLink')}
            </div>
            <div className="auth-footer">
              <Link to="/forgot-password" className="auth-link">{t('auth.resetNewRequest')}</Link>
            </div>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-password">{t('auth.resetNewPassword')}</label>
              <input
                id="reset-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-confirm">{t('common.passwordConfirm')}</label>
              <input
                id="reset-confirm"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div className="form-error" role="alert">{error.key ? t(error.key) : error.text}</div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
              disabled={loading}
            >
              {loading ? t('auth.resetPending') : t('auth.resetSubmit')}
            </button>
          </form>
        )}
      </div>

      <div className="auth-bg">
        <div className="auth-bg-line-h"></div>
        <div className="auth-bg-line-v"></div>
      </div>
    </main>
  )
}
