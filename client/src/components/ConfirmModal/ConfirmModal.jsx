// Confirmation avant une action destructive.

import { useTranslation } from 'react-i18next'
import './ConfirmModal.css'

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  const { t } = useTranslation()

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-ghost" onClick={onCancel}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={onConfirm}>{t('common.confirm')}</button>
        </div>
      </div>
    </div>
  )
}
