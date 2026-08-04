// Filtres du catalogue. Le curseur de prix attend de connaître le prix max réel.

import './Filters.css'

export default function Filters({ filters, onChange, onReset, brands = [], fuelTypes = [], transmissions = [], years = [], priceMax = null }) {
  // « Pas de filtre de prix » vaut Infinity, mais un <input range> veut un nombre : on
  // retombe sur le prix max du catalogue.
  const sliderValue = filters.price_max === Infinity ? priceMax : Math.min(Number(filters.price_max), priceMax)
  const isMaxPrice = filters.price_max === Infinity || Number(filters.price_max) >= priceMax
  // Calculés depuis les données réelles : ~100 crans, arrondis au millier.
  const sliderStep = priceMax ? Math.max(1000, Math.round(priceMax / 100 / 1000) * 1000) : 1000
  const sliderMin = priceMax ? Math.round(priceMax * 0.05 / sliderStep) * sliderStep : 0

  return (
    <aside className="filters">
      <div className="filters-header">
        <span className="tag">Filtres</span>
        <button className="filters-reset" onClick={onReset}>
          Réinitialiser
        </button>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-brand">Marque</label>
        <select
          id="filter-brand"
          className="filter-select"
          value={filters.brand}
          onChange={e => onChange('brand', e.target.value)}
        >
          <option value="">Toutes</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-fuel">Carburant</label>
        <select
          id="filter-fuel"
          className="filter-select"
          value={filters.fuel_type}
          onChange={e => onChange('fuel_type', e.target.value)}
        >
          <option value="">Tous</option>
          {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-transmission">Transmission</label>
        <select
          id="filter-transmission"
          className="filter-select"
          value={filters.transmission}
          onChange={e => onChange('transmission', e.target.value)}
        >
          <option value="">Toutes</option>
          {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {priceMax && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-price">
            Prix max — {isMaxPrice ? 'Sans limite' : `${sliderValue.toLocaleString('fr-FR')} €`}
          </label>
          <input
            id="filter-price"
            type="range"
            className="filter-range"
            min={sliderMin}
            max={priceMax}
            step={sliderStep}
            value={sliderValue}
            onChange={e => {
              const v = Number(e.target.value)
              onChange('price_max', v >= priceMax ? Infinity : v)
            }}
          />
          <div className="filter-range-labels">
            <span>{sliderMin.toLocaleString('fr-FR')} €</span>
            <span>Max</span>
          </div>
        </div>
      )}

      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-year">Année minimum</label>
        <select
          id="filter-year"
          className="filter-select"
          value={filters.year_min}
          onChange={e => onChange('year_min', e.target.value)}
        >
          <option value="">Toutes</option>
          {years.map(y => (
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