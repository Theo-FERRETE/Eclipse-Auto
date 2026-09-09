// Rappel du véhicule choisi, avec le total recalculé en direct selon les options cochées.

import { optimizeImageUrl, formatPrice } from '@/lib/utils'

export default function AchatVehiclePanel({ vehicle, selectedEquipements }) {
  const { brand, model, year, fuel_type, transmission, mileage, power, price, images } = vehicle

  const optionsTotal = selectedEquipements.reduce((sum, eq) => sum + Number(eq.prix_supplement), 0)
  const total = Number(price) + optionsTotal

  return (
    <div className="reservation-vehicle">
      <div className="tag">{brand}</div>
      <h1 className="reservation-title">{model}</h1>
      <div className="reservation-year">{year}</div>

      <div className="reservation-img">
        {images?.[0]
          ? <img
              src={optimizeImageUrl(images[0], 800)}
              alt={`${brand} ${model}`}
              loading="eager"
              decoding="async"
              style={{ opacity: 0, transition: 'opacity 0.4s ease' }}
              onLoad={e => { e.currentTarget.style.opacity = '1' }}
            />
          : <div className="reservation-img-placeholder"></div>
        }
        <div className="gallery-bar"></div>
      </div>

      <div className="reservation-specs">
        {[
          { label: 'Carburant', value: fuel_type },
          { label: 'Transmission', value: transmission },
          { label: 'Kilométrage', value: mileage === 0 ? 'Neuf' : mileage ? `${mileage.toLocaleString('fr-FR')} km` : 'N/A' },
          { label: 'Puissance', value: power || 'N/A' },
        ].map((spec, i) => (
          <div className="spec-row" key={i}>
            <span className="spec-label">{spec.label}</span>
            <span className="spec-value">{spec.value}</span>
          </div>
        ))}
      </div>

      {selectedEquipements.length > 0 && (
        <div className="reservation-specs">
          <div className="spec-row">
            <span className="spec-label">Véhicule</span>
            <span className="spec-value">{formatPrice(price)}</span>
          </div>
          {selectedEquipements.map(eq => (
            <div className="spec-row" key={eq.id}>
              <span className="spec-label">{eq.nom}</span>
              <span className="spec-value">+{Number(eq.prix_supplement).toLocaleString('fr-FR')} €</span>
            </div>
          ))}
        </div>
      )}

      <div className="reservation-price-block">
        <span className="reservation-price-label">Total</span>
        <span className="reservation-price">{formatPrice(total)}</span>
      </div>
    </div>
  )
}
