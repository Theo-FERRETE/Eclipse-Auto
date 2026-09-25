// Formulaire d'achat : options, mode de paiement. Composant contrôlé.

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PAYMENT_METHODS } from '@/lib/constants'
import { formatNumber } from '@/lib/utils'

export default function AchatForm({
  modePaiement, onModePaiementChange, onSubmit, error, submitting, profile, user, slug,
  equipements = [], selectedEquipementIds = [], onToggleEquipement, fromReservation,
}) {
  const { t } = useTranslation()

  return (
    <div className="reservation-form-wrap">
      <div className="reservation-form-header">
        <div className="tag">{t('reservation.formTag')}</div>
        <h2 className="reservation-form-title">{t('achat.formTitle')}</h2>
      </div>

      {fromReservation && (
        <div className="reservation-disclaimer" style={{ borderLeftColor: 'var(--cyan)' }}>
          {t('achat.fromReservation')}
        </div>
      )}

      <div className="reservation-client-info">
        <div className="client-info-label">{t('reservation.yourInfo')}</div>
        <div className="client-info-row">
          <span className="client-info-key">{t('common.fullName')}</span>
          <span className="client-info-val">{profile?.first_name} {profile?.last_name}</span>
        </div>
        <div className="client-info-row">
          <span className="client-info-key">{t('common.email')}</span>
          <span className="client-info-val">{user?.email}</span>
        </div>
      </div>

      {equipements.length > 0 && (
        <div className="reservation-client-info">
          <div className="client-info-label">{t('achat.optionsLabel')}</div>
          <div className="detail-equip-grid">
            {/* eq.nom vient de la base, saisi par l'admin : affiché tel quel. */}
            {equipements.map(eq => (
              <label key={eq.id} className="detail-equip-item">
                <input
                  type="checkbox"
                  checked={selectedEquipementIds.includes(eq.id)}
                  onChange={() => onToggleEquipement(eq.id)}
                />
                {t('achat.optionPrice', {
                  name: eq.nom,
                  price: `${formatNumber(eq.prix_supplement)} €`,
                })}
              </label>
            ))}
          </div>
        </div>
      )}

      <form className="reservation-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="achat-mode-paiement">{t('achat.paymentLabel')}</label>
          <select
            id="achat-mode-paiement"
            name="mode_paiement"
            className="form-input"
            value={modePaiement}
            onChange={onModePaiementChange}
            required
          >
            <option value="" disabled>{t('achat.paymentPlaceholder')}</option>
            {/* La valeur envoyée reste la clé attendue par l'API ('carte'…). */}
            {PAYMENT_METHODS.map(m => (
              <option key={m} value={m}>{t(`payment.${m}`)}</option>
            ))}
          </select>
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="reservation-disclaimer">
          {t('achat.disclaimer')}
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '13px' }}
          disabled={submitting}
        >
          {submitting ? t('reservation.submitting') : t('achat.submit')}
        </button>

        <Link
          to={`/vehicles/${slug}`}
          className="btn-ghost"
          style={{ display: 'block', width: '100%', padding: '14px', textAlign: 'center', fontSize: '12px' }}
        >
          {t('common.cancel')}
        </Link>
      </form>
    </div>
  )
}
