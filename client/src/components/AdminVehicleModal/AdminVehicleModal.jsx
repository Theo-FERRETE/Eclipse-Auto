// Formulaire de création / modification d'un véhicule.

export default function AdminVehicleModal({ form, onChange, onSubmit, onClose, editing, submitting, error, success }) {
  return (
    <div className="vehicle-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="vehicle-modal">
        <div className="vehicle-modal-header">
          <div>
            <div className="tag">{editing ? 'Modifier le véhicule' : 'Nouveau véhicule'}</div>
          </div>
          <button className="vehicle-modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <form className="vehicle-modal-form" onSubmit={onSubmit}>
          <div className="vmf-row">
            <div className="vmf-group">
              <label className="vmf-label" htmlFor="vmf-brand">Marque *</label>
              <input id="vmf-brand" name="brand" className="vmf-input" value={form.brand} onChange={onChange} required placeholder="Ferrari" />
            </div>
            <div className="vmf-group">
              <label className="vmf-label" htmlFor="vmf-model">Modèle *</label>
              <input id="vmf-model" name="model" className="vmf-input" value={form.model} onChange={onChange} required placeholder="Roma Spider" />
            </div>
          </div>

          <div className="vmf-row">
            <div className="vmf-group">
              <label className="vmf-label" htmlFor="vmf-year">Année *</label>
              <input id="vmf-year" name="year" type="number" className="vmf-input" value={form.year} onChange={onChange} required placeholder="2024" />
            </div>
            <div className="vmf-group">
              <label className="vmf-label" htmlFor="vmf-price">Prix (€) *</label>
              <input id="vmf-price" name="price" type="number" className="vmf-input" value={form.price} onChange={onChange} required placeholder="248000" />
            </div>
          </div>

          <div className="vmf-row">
            <div className="vmf-group">
              <label className="vmf-label" htmlFor="vmf-fuel">Carburant *</label>
              <select id="vmf-fuel" name="fuel_type" className="vmf-input" value={form.fuel_type} onChange={onChange} required>
                <option value="">Sélectionner</option>
                <option value="ESSENCE">Essence</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRIDE">Hybride</option>
                <option value="ELECTRIQUE">Électrique</option>
              </select>
            </div>
            <div className="vmf-group">
              <label className="vmf-label" htmlFor="vmf-transmission">Transmission *</label>
              <select id="vmf-transmission" name="transmission" className="vmf-input" value={form.transmission} onChange={onChange} required>
                <option value="">Sélectionner</option>
                <option value="AUTOMATIQUE">Automatique</option>
                <option value="MANUELLE">Manuelle</option>
              </select>
            </div>
          </div>

          <div className="vmf-row">
            <div className="vmf-group">
              <label className="vmf-label" htmlFor="vmf-mileage">Kilométrage</label>
              <input id="vmf-mileage" name="mileage" type="number" className="vmf-input" value={form.mileage} onChange={onChange} placeholder="0" />
            </div>
            <div className="vmf-group">
              <label className="vmf-label" htmlFor="vmf-power">Puissance</label>
              <input id="vmf-power" name="power" className="vmf-input" value={form.power} onChange={onChange} placeholder="620 CH" />
            </div>
          </div>

          <div className="vmf-group">
            <label className="vmf-label" htmlFor="vmf-status">Statut</label>
            <select id="vmf-status" name="status" className="vmf-input" value={form.status} onChange={onChange}>
              <option value="available">Disponible</option>
              <option value="reserved">Réservé</option>
              <option value="sold">Vendu</option>
            </select>
          </div>

          <div className="vmf-group">
            <label className="vmf-label" htmlFor="vmf-image">URL de l'image</label>
            <input id="vmf-image" name="image" className="vmf-input" value={form.image} onChange={onChange} placeholder="https://..." />
          </div>

          <div className="vmf-group">
            <label className="vmf-label" htmlFor="vmf-description">Description</label>
            <textarea id="vmf-description" name="description" className="vmf-input vmf-textarea" value={form.description} onChange={onChange} placeholder="Description du véhicule..." rows={3} />
          </div>

          {error && <div className="vmf-error" role="alert">{error}</div>}
          {success && <div className="vmf-success" role="status">{success}</div>}

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
