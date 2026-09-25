// Demande de réinitialisation du mot de passe, gérée par Supabase.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import '../Login/Login.css'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(false)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(true)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/eclipse-auto.svg" alt="Eclipse Auto" className="auth-logo" />
          <div className="tag">{t('auth.memberTag')}</div>
          <h1 className="auth-title">{t('auth.forgotTitle')}</h1>
        </div>

        {sent ? (
          <div className="form-success">
            {/* Trans plutôt que t() : la phrase contient du balisage (l'email en gras,
                un retour à la ligne) que les traducteurs doivent pouvoir déplacer. */}
            <Trans
              i18nKey="auth.forgotSent"
              values={{ email }}
              components={{ b: <strong />, br: <br /> }}
            />
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">{t('common.email')}</label>
              <input
                id="forgot-email"
                type="email"
                className="form-input"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && <div className="form-error" role="alert">{t('auth.forgotError')}</div>}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
              disabled={loading}
            >
              {loading ? t('common.sending') : t('auth.forgotSubmit')}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login" className="auth-link">{t('auth.backToLogin')}</Link>
        </div>
      </div>

      <div className="auth-bg">
        <div className="auth-bg-line-h"></div>
        <div className="auth-bg-line-v"></div>
      </div>
    </main>
  )
}
