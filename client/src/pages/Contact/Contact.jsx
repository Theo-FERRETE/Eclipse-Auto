import { useState } from 'react'
import './Contact.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setSuccess(true)
    setLoading(false)
  }

  return (
    <main className="contact">
      <div className="contact-hero">
        <div className="container">
          <div className="tag">Nous contacter</div>
          <h1 className="contact-title">Contact</h1>
          <p className="contact-sub">Une question ? Prenez rendez-vous ou envoyez-nous un message.</p>
        </div>
      </div>

      <div className="divider"></div>

      <div className="container contact-layout">
        <div className="contact-info">
          <div className="info-block">
            <div className="info-label">Adresse</div>
            <div className="info-value">123 Avenue de la Performance<br />75008 Paris, France</div>
          </div>
          <div className="info-block">
            <div className="info-label">Téléphone</div>
            <div className="info-value">+33 1 23 45 67 89</div>
          </div>
          <div className="info-block">
            <div className="info-label">Email</div>
            <div className="info-value">contact@eclipse-auto.fr</div>
          </div>
          <div className="info-block">
            <div className="info-label">Horaires</div>
            <div className="info-value">
              Lundi — Vendredi : 9h — 19h<br />
              Samedi : 10h — 17h<br />
              Dimanche : Fermé
            </div>
          </div>
          <div className="contact-note">
            Ce formulaire est à titre démonstratif — aucun email n'est envoyé dans cette version.
          </div>
        </div>

        <div className="contact-form-wrap">
          {success ? (
            <div className="contact-success">
              <div className="success-icon">✓</div>
              <div className="tag">Confirmation</div>
              <h2 className="success-title">Message envoyé !</h2>
              <p>Notre équipe vous répondra dans les plus brefs délais.</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Prénom et nom *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    placeholder="+33 6 00 00 00 00"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
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
                <label className="form-label">Message *</label>
                <textarea
                  name="message"
                  className="form-input form-textarea"
                  placeholder="Votre message..."
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '14px' }}
                disabled={loading}
              >
                {loading ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}