export default function AdminVehicleModal({ form, onChange, onSubmit, onClose, editing, submitting, error, success }) {
  return (
    <div className="vehicle-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="vehicle-modal">
        <div className="vehicle-modal-header">
          <div>
            <div className="tag">{editing ? 'Modifier le véhicule' : 'Nouveau véhicule'}</div>
          </div>
          <button className="vehicle-modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="vehicle-modal-form" onSubmit={onSubmit}>
          <div className="vmf-row">
            <div className="vmf-group">
              <label className="vmf-label">Marque *</label>
              <input name="brand" className="vmf-input" value={form.brand} onChange={onChange} required placeholder="Ferrari" />
            </div>
            <div className="vmf-group">
              <label className="vmf-label">Modèle *</label>
              <input name="model" className="vmf-input" value={form.model} onChange={onChange} required placeholder="Roma Spider" />
            </div>
          </div>

          <div className="vmf-row">
            <div className="vmf-group">
              <label className="vmf-label">Année *</label>
              <input name="year" type="number" className="vmf-input" value={form.year} onChange={onChange} required placeholder="2024" />
            </div>
            <div className="vmf-group">
              <label className="vmf-label">Prix (€) *</label>
              <input name="price" type="number" className="vmf-input" value={form.price} onChange={onChange} required placeholder="248000" />
            </div>
          </div>

          <div className="vmf-row">
            <div className="vmf-group">
              <label className="vmf-label">Carburant *</label>
              <select name="fuel_type" className="vmf-input" value={form.fuel_type} onChange={onChange} required>
                <option value="">Sélectionner</option>
                <option value="ESSENCE">Essence</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRIDE">Hybride</option>
                <option value="ELECTRIQUE">Électrique</option>
              </select>
            </div>
            <div className="vmf-group">
              <label className="vmf-label">Transmission *</label>
              <select name="transmission" className="vmf-input" value={form.transmission} onChange={onChange} required>
                <option value="">Sélectionner</option>
                <option value="AUTOMATIQUE">Automatique</option>
                <option value="MANUELLE">Manuelle</option>
              </select>
            </div>
          </div>

          <div className="vmf-row">
            <div className="vmf-group">
              <label className="vmf-label">Kilométrage</label>
              <input name="mileage" type="number" className="vmf-input" value={form.mileage} onChange={onChange} placeholder="0" />
            </div>
            <div className="vmf-group">
              <label className="vmf-label">Puissance</label>
              <input name="power" className="vmf-input" value={form.power} onChange={onChange} placeholder="620 CH" />
            </div>
          </div>

          <div className="vmf-group">
            <label className="vmf-label">Statut</label>
            <select name="status" className="vmf-input" value={form.status} onChange={onChange}>
              <option value="available">Disponible</option>
              <option value="reserved">Réservé</option>
              <option value="sold">Vendu</option>
            </select>
          </div>

          <div className="vmf-group">
            <label className="vmf-label">URL de l'image</label>
            <input name="image" className="vmf-input" value={form.image} onChange={onChange} placeholder="https://..." />
          </div>

          <div className="vmf-group">
            <label className="vmf-label">Description</label>
            <textarea name="description" className="vmf-input vmf-textarea" value={form.description} onChange={onChange} placeholder="Description du véhicule..." rows={3} />
          </div>

          {error && <div className="vmf-error">{error}</div>}
          {success && <div className="vmf-success">{success}</div>}

          <div className="vmf-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
