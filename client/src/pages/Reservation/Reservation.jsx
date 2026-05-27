import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { toSlug, optimizeImageUrl, formatPrice } from '@/lib/utils'
import './Reservation.css'

export default function Reservation() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    message: '',
    rdv_date: '',
  })

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        navigate('/login')
        return
      }

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')

      if (error || !data) {
        navigate('/catalogue')
        return
      }

      const found = data.find(v => toSlug(v.brand, v.model) === slug)
      if (!found || found.status !== 'available') {
        navigate('/catalogue')
        return
      }

      setVehicle(found)
      setLoading(false)
    }

    init()
  }, [slug])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('reservations')
        .insert({
          vehicle_id: vehicle.id,
          client_id: user.id,
          status: 'pending',
          message: form.message || null,
          rdv_date: form.rdv_date || null,
        })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 3000)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="reservation-loading">
        <div className="loader"></div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="reservation-success-page">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <div className="tag">Confirmation</div>
            <h1 className="success-title">Réservation envoyée !</h1>
            <p className="success-desc">
              Votre demande de réservation pour la <strong>{vehicle.brand} {vehicle.model}</strong> a bien été enregistrée. Notre équipe vous contactera dans les plus brefs délais.
            </p>
            <p className="success-redirect">
              Redirection vers votre espace client dans 3 secondes...
            </p>
            <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-block', marginTop: '8px' }}>
              Voir mes réservations
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="reservation">
      <div className="reservation-breadcrumb">
        <div className="container">
          <Link to="/catalogue" className="breadcrumb-back">← Catalogue</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to={`/vehicles/${slug}`} className="breadcrumb-back">{vehicle.brand} {vehicle.model}</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Réservation</span>
        </div>
      </div>

      <div className="container reservation-layout">
        <div className="reservation-vehicle">
          <div className="tag">{vehicle.brand}</div>
          <h1 className="reservation-title">{vehicle.model}</h1>
          <div className="reservation-year">{vehicle.year}</div>

          <div className="reservation-img">
            {vehicle.images?.[0]
              ? <img
                  src={optimizeImageUrl(vehicle.images[0], 800)}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  loading="eager"
                  decoding="async"
                  style={{ opacity: 0, transition: 'opacity 0.4s ease' }}
                  onLoad={e => { e.currentTarget.style.opacity = '1' }}
                />
              : <div className="reservation-img-placeholder"></div>
            }
            <div className="gallery-bar"></div>
          </div>

          <div className="reservation-specs">
            {[
              { label: 'Carburant', value: vehicle.fuel_type },
              { label: 'Transmission', value: vehicle.transmission },
              { label: 'Kilométrage', value: vehicle.mileage === 0 ? 'Neuf' : vehicle.mileage ? `${vehicle.mileage.toLocaleString('fr-FR')} km` : 'N/A' },
              { label: 'Puissance', value: vehicle.power || 'N/A' },
            ].map((spec, i) => (
              <div className="spec-row" key={i}>
                <span className="spec-label">{spec.label}</span>
                <span className="spec-value">{spec.value}</span>
              </div>
            ))}
          </div>

          <div className="reservation-price-block">
            <span className="reservation-price-label">Prix</span>
            <span className="reservation-price">
              {formatPrice(vehicle.price)}
            </span>
          </div>
        </div>

        <div className="reservation-form-wrap">
          <div className="reservation-form-header">
            <div className="tag">Formulaire</div>
            <h2 className="reservation-form-title">Votre demande</h2>
          </div>

          <div className="reservation-client-info">
            <div className="client-info-label">Vos informations</div>
            <div className="client-info-row">
              <span className="client-info-key">Nom</span>
              <span className="client-info-val">{profile?.first_name} {profile?.last_name}</span>
            </div>
            <div className="client-info-row">
              <span className="client-info-key">Email</span>
              <span className="client-info-val">{user?.email}</span>
            </div>
          </div>

          <form className="reservation-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Date de rendez-vous souhaitée</label>
              <input
                type="datetime-local"
                name="rdv_date"
                className="form-input"
                value={form.rdv_date}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message (optionnel)</label>
              <textarea
                name="message"
                className="form-input form-textarea"
                placeholder="Précisez vos questions ou demandes particulières..."
                value={form.message}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="reservation-disclaimer">
              En soumettant ce formulaire, vous faites une demande de réservation. Notre équipe vous contactera pour confirmer le rendez-vous. Aucun paiement n'est requis à cette étape.
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '13px' }}
              disabled={submitting}
            >
              {submitting ? 'Envoi en cours...' : 'Confirmer la demande'}
            </button>

            <Link
              to={`/vehicles/${slug}`}
              className="btn-ghost"
              style={{ display: 'block', width: '100%', padding: '14px', textAlign: 'center', fontSize: '12px' }}
            >
              Annuler
            </Link>
          </form>
        </div>
      </div>
    </main>
  )
}