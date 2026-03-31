import './ConfirmModal.css'

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-ghost" onClick={onCancel}>Annuler</button>
          <button className="btn-primary" onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}
