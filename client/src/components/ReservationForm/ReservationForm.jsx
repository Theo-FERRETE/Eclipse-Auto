// Formulaire de demande d'essai. Composant contrôlé.

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function ReservationForm({
  form, onChange, onSubmit, error, submitting, profile, user, slug,
}) {
  const { t } = useTranslation()

  return (
    <div className="reservation-form-wrap">
      <div className="reservation-form-header">
        <div className="tag">{t('reservation.formTag')}</div>
        <h2 className="reservation-form-title">{t('reservation.formTitle')}</h2>
      </div>

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

      <form className="reservation-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="res-rdv-date">{t('reservation.startLabel')}</label>
          <input
            id="res-rdv-date"
            type="datetime-local"
            name="rdv_date"
            className="form-input"
            value={form.rdv_date}
            onChange={onChange}
            min={new Date().toISOString().slice(0, 16)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="res-rdv-date-fin">{t('reservation.endLabel')}</label>
          <input
            id="res-rdv-date-fin"
            type="datetime-local"
            name="rdv_date_fin"
            className="form-input"
            value={form.rdv_date_fin}
            onChange={onChange}
            min={form.rdv_date || new Date().toISOString().slice(0, 16)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="res-message">{t('reservation.messageLabel')}</label>
          <textarea
            id="res-message"
            name="message"
            className="form-input form-textarea"
            placeholder={t('reservation.messagePlaceholder')}
            value={form.message}
            onChange={onChange}
            rows={4}
          />
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="reservation-disclaimer">
          {t('reservation.disclaimer')}
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '13px' }}
          disabled={submitting}
        >
          {submitting ? t('reservation.submitting') : t('reservation.submit')}
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
