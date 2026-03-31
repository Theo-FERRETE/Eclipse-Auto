import './Filters.css'

export default function Filters({ filters, onChange, onReset, brands = [] }) {
  return (
    <aside className="filters">
      <div className="filters-header">
        <span className="tag">Filtres</span>
        <button className="filters-reset" onClick={onReset}>
          Réinitialiser
        </button>
      </div>

      <div className="filter-group">
        <label className="filter-label">Marque</label>
        <select
          className="filter-select"
          value={filters.brand}
          onChange={e => onChange('brand', e.target.value)}
        >
          <option value="">Toutes</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Carburant</label>
        <select
          className="filter-select"
          value={filters.fuel_type}
          onChange={e => onChange('fuel_type', e.target.value)}
        >
          <option value="">Tous</option>
          <option value="Essence">Essence</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybride">Hybride</option>
          <option value="Électrique">Électrique</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Transmission</label>
        <select
          className="filter-select"
          value={filters.transmission}
          onChange={e => onChange('transmission', e.target.value)}
        >
          <option value="">Toutes</option>
          <option value="Automatique">Automatique</option>
          <option value="Manuelle">Manuelle</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          Prix max — € {Number(filters.price_max).toLocaleString('fr-FR')}
        </label>
        <input
          type="range"
          className="filter-range"
          min="50000"
          max="700000"
          step="10000"
          value={filters.price_max}
          onChange={e => onChange('price_max', e.target.value)}
        />
        <div className="filter-range-labels">
          <span>50 000 €</span>
          <span>700 000 €</span>
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Année minimum</label>
        <select
          className="filter-select"
          value={filters.year_min}
          onChange={e => onChange('year_min', e.target.value)}
        >
          <option value="">Toutes</option>
          {[2024, 2023, 2022, 2021, 2020].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Statut</label>
        <div className="filter-checkboxes">
          {['available', 'reserved', 'sold'].map(s => (
            <label key={s} className="filter-check">
              <input
                type="checkbox"
                checked={filters.status.includes(s)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...filters.status, s]
                    : filters.status.filter(x => x !== s)
                  onChange('status', next)
                }}
              />
              <span className={`check-label check-${s}`}>
                {s === 'available' ? 'Disponible' : s === 'reserved' ? 'Réservé' : 'Vendu'}
              </span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  )
}