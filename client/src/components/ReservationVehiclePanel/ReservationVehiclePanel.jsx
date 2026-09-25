// Rappel du véhicule choisi pour l'essai. Pas de prix ici : un essai est gratuit et sans
// options, le prix n'a de sens que côté achat (voir AchatVehiclePanel).

import { useTranslation } from 'react-i18next'
import { optimizeImageUrl, formatNumber, translateFuel, translateTransmission } from '@/lib/utils'

export default function ReservationVehiclePanel({ vehicle }) {
  const { brand, model, year, fuel_type, transmission, mileage, power, images } = vehicle
  const { t } = useTranslation()

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
          { label: t('vehicle.fuel'), value: translateFuel(fuel_type) },
          { label: t('vehicle.transmission'), value: translateTransmission(transmission) },
          {
            label: t('vehicle.mileage'),
            value: mileage === 0
              ? t('common.new')
              : mileage ? t('vehicle.mileageValue', { value: formatNumber(mileage) }) : t('common.na'),
          },
          { label: t('vehicle.power'), value: power || t('common.na') },
        ].map((spec, i) => (
          <div className="spec-row" key={i}>
            <span className="spec-label">{spec.label}</span>
            <span className="spec-value">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
