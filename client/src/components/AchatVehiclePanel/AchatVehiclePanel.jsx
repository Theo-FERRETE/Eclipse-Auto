// Rappel du véhicule choisi, avec le total recalculé en direct selon les options cochées.

import { useTranslation } from 'react-i18next'
import {
  optimizeImageUrl, formatPrice, formatNumber,
  translateFuel, translateTransmission,
} from '@/lib/utils'

export default function AchatVehiclePanel({ vehicle, selectedEquipements }) {
  const { brand, model, year, fuel_type, transmission, mileage, power, price, images } = vehicle
  const { t } = useTranslation()

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

      {selectedEquipements.length > 0 && (
        <div className="reservation-specs">
          <div className="spec-row">
            <span className="spec-label">{t('achat.vehicleLine')}</span>
            <span className="spec-value">{formatPrice(price)}</span>
          </div>
          {/* Le nom de l'option vient de la base, saisi par l'admin : il reste tel quel. */}
          {selectedEquipements.map(eq => (
            <div className="spec-row" key={eq.id}>
              <span className="spec-label">{eq.nom}</span>
              <span className="spec-value">+{formatNumber(eq.prix_supplement)} €</span>
            </div>
          ))}
        </div>
      )}

      <div className="reservation-price-block">
        <span className="reservation-price-label">{t('common.total')}</span>
        <span className="reservation-price">{formatPrice(total)}</span>
      </div>
    </div>
  )
}
