import { Link } from 'react-router-dom'

export default function ReservationForm({ form, onChange, onSubmit, error, submitting, profile, user, slug }) {
  return (
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

      <form className="reservation-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label">Date de rendez-vous souhaitée</label>
          <input
            type="datetime-local"
            name="rdv_date"
            className="form-input"
            value={form.rdv_date}
            onChange={onChange}
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
            onChange={onChange}
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
  )
}
