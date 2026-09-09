// Formulaire d'achat : options, mode de paiement. Composant contrôlé.

import { Link } from 'react-router-dom'
import { PAYMENT_METHODS } from '@/lib/constants'
import { PAYMENT_METHOD_LABELS } from '@/lib/utils'

export default function AchatForm({
  modePaiement, onModePaiementChange, onSubmit, error, submitting, profile, user, slug,
  equipements = [], selectedEquipementIds = [], onToggleEquipement, fromReservation,
}) {
  return (
    <div className="reservation-form-wrap">
      <div className="reservation-form-header">
        <div className="tag">Formulaire</div>
        <h2 className="reservation-form-title">Votre achat</h2>
      </div>

      {fromReservation && (
        <div className="reservation-disclaimer" style={{ borderLeftColor: 'var(--cyan)' }}>
          Cet achat sera lié à l'essai que vous avez déjà effectué.
        </div>
      )}

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

      {equipements.length > 0 && (
        <div className="reservation-client-info">
          <div className="client-info-label">Options</div>
          <div className="detail-equip-grid">
            {equipements.map(eq => (
              <label key={eq.id} className="detail-equip-item">
                <input
                  type="checkbox"
                  checked={selectedEquipementIds.includes(eq.id)}
                  onChange={() => onToggleEquipement(eq.id)}
                />
                {eq.nom} (+{Number(eq.prix_supplement).toLocaleString('fr-FR')} €)
              </label>
            ))}
          </div>
        </div>
      )}

      <form className="reservation-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="achat-mode-paiement">Mode de paiement</label>
          <select
            id="achat-mode-paiement"
            name="mode_paiement"
            className="form-input"
            value={modePaiement}
            onChange={onModePaiementChange}
            required
          >
            <option value="" disabled>Choisir un mode de paiement</option>
            {PAYMENT_METHODS.map(m => (
              <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
            ))}
          </select>
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="reservation-disclaimer">
          En soumettant ce formulaire, vous faites une demande d'achat. Notre équipe vous contactera pour finaliser la transaction et le paiement.
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '13px' }}
          disabled={submitting}
        >
          {submitting ? 'Envoi en cours...' : 'Confirmer la demande d\'achat'}
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
