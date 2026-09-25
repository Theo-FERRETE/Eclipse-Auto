// Formulaire de contact.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { readApiError } from '@/lib/apiError'
import './Contact.css'

export default function Contact() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      // readApiError traduit le `code` renvoyé par l'API, et retombe sur son message
      // quand il n'y en a pas.
      if (!res.ok) throw new Error(await readApiError(res))
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="contact">
      <div className="contact-hero">
        <div className="page-section">
          <div className="tag">{t('contact.tag')}</div>
          <h1 className="contact-title">{t('contact.title')}</h1>
          <p className="contact-sub">{t('contact.sub')}</p>
        </div>
      </div>

      <div className="divider"></div>

      <div className="page-section contact-layout">
        <div className="contact-info">
          <div className="info-block">
            <div className="info-value">{t('contact.addressLine1')}<br />{t('contact.addressLine2')}</div>
            <div className="info-label">{t('contact.addressLabel')}</div>
          </div>
          <div className="info-block">
            <div className="info-value">+33 4 93 47 82 10</div>
            <div className="info-label">{t('contact.phoneLabel')}</div>
          </div>
          <div className="info-block">
            <div className="info-value">theo.ferrete@gmail.com</div>
            <div className="info-label">{t('contact.emailLabel')}</div>
          </div>
          <div className="info-block">
            <div className="info-value">
              {t('contact.hoursWeek')}<br />
              {t('contact.hoursSaturday')}<br />
              {t('contact.hoursSunday')}
            </div>
            <div className="info-label">{t('contact.hoursLabel')}</div>
          </div>
          <div className="contact-note">
            {t('contact.note')}
          </div>
        </div>

        <div className="contact-form-wrap">
          {success ? (
            <div className="contact-success">
              <div className="tag">{t('contact.successTag')}</div>
              <h2 className="success-title">{t('contact.successTitle')}</h2>
              <p>{t('contact.successDesc')}</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('contact.nameLabel')}</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder={t('contact.namePlaceholder')}
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('common.phone')}</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    placeholder={t('contact.phonePlaceholder')}
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('contact.emailRequired')}</label>
                <input
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
                <label className="form-label">{t('contact.messageLabel')}</label>
                <textarea
                  name="message"
                  className="form-input form-textarea"
                  placeholder={t('contact.messagePlaceholder')}
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </div>

              {error && <div className="form-error">{error}</div>}
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '14px' }}
                disabled={loading}
              >
                {loading ? t('common.sending') : t('contact.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
