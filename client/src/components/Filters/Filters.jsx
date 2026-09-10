// Filtres du catalogue. Une rangée de pastilles simples (statut/carburant, un seul choix
// actif) reprend la maquette pour le cas courant ; marque/transmission/année/prix restent
// disponibles mais repliés derrière « Plus de filtres » pour ne pas les perdre.

import { useState } from 'react'
import { capitalize } from '@/lib/utils'
import './Filters.css'

// Doit rester synchronisé avec DEFAULT_STATUS dans pages/Catalogue/catalogueFilters.js
// (statut par défaut quand rien n'est dans l'URL) : dupliqué plutôt qu'importé pour ne
// pas faire dépendre ce composant partagé d'une page précise.
const DEFAULT_STATUS = ['available', 'reserved', 'sold']

export default function Filters({ filters, onChange, onReset, brands = [], fuelTypes = [], transmissions = [], years = [], priceMax = null }) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const sliderValue = filters.price_max === Infinity ? priceMax : Math.min(Number(filters.price_max), priceMax)
  const isMaxPrice = filters.price_max === Infinity || Number(filters.price_max) >= priceMax
  const sliderStep = priceMax ? Math.max(1000, Math.round(priceMax / 100 / 1000) * 1000) : 1000
  const sliderMin = priceMax ? Math.round(priceMax * 0.05 / sliderStep) * sliderStep : 0

  const isDefaultStatus = DEFAULT_STATUS.every(s => filters.status.includes(s)) && filters.status.length === 3
  const isAllPill = isDefaultStatus && !filters.fuel_type
  const isAvailablePill = !filters.fuel_type && filters.status.length === 1 && filters.status[0] === 'available'

  function selectAll() {
    onChange({ status: [...DEFAULT_STATUS], fuel_type: '' })
  }

  function selectAvailable() {
    onChange({ status: ['available'], fuel_type: '' })
  }

  function selectFuel(fuel) {
    onChange({ status: [...DEFAULT_STATUS], fuel_type: fuel })
  }

  function toggleStatus(value) {
    const next = filters.status.includes(value)
      ? filters.status.filter(s => s !== value)
      : [...filters.status, value]
    onChange({ status: next })
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar-row">
        <div className="filter-pills">
          <button type="button" className={`filter-pill${isAllPill ? ' active' : ''}`} onClick={selectAll}>
            Tous
          </button>
          <button type="button" className={`filter-pill${isAvailablePill ? ' active' : ''}`} onClick={selectAvailable}>
            Disponibles
          </button>
          {fuelTypes.map(f => (
            <button
              key={f}
              type="button"
              className={`filter-pill${filters.fuel_type === f ? ' active' : ''}`}
              onClick={() => selectFuel(f)}
            >
              {capitalize(f)}
            </button>
          ))}
        </div>
        <div className="filter-bar-actions">
          <button type="button" className="filters-advanced-toggle" onClick={() => setAdvancedOpen(v => !v)}>
            Plus de filtres {advancedOpen ? '−' : '+'}
          </button>
          <button className="filters-reset" onClick={onReset}>
            Réinitialiser
          </button>
        </div>
      </div>

      {advancedOpen && (
        <div className="filter-bar-row filter-bar-advanced">
          <select
            className="filter-pill-select"
            aria-label="Marque"
            value={filters.brand}
            onChange={e => onChange({ brand: e.target.value })}
          >
            <option value="">Marque</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            className="filter-pill-select"
            aria-label="Transmission"
            value={filters.transmission}
            onChange={e => onChange({ transmission: e.target.value })}
          >
            <option value="">Transmission</option>
            {transmissions.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
          </select>

          <select
            className="filter-pill-select"
            aria-label="Année minimum"
            value={filters.year_min}
            onChange={e => onChange({ year_min: e.target.value })}
          >
            <option value="">Année minimum</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {priceMax && (
            <div className="filter-price">
              <label htmlFor="filter-price" className="filter-price-label">
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
                  onChange({ price_max: v >= priceMax ? Infinity : v })
                }}
              />
            </div>
          )}

          <div className="filter-pills">
            {[['reserved', 'Réservé'], ['sold', 'Vendu']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`filter-pill filter-pill-small${filters.status.includes(value) ? ' active' : ''}`}
                onClick={() => toggleStatus(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
