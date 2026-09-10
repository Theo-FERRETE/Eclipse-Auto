// Carte véhicule du catalogue.

import { Link } from 'react-router-dom'
import { toSlug, optimizeImageUrl, formatPrice, capitalize, VEHICLE_STATUS } from '@/lib/utils'
import './VehicleCard.css'

export default function VehicleCard({ vehicle, index }) {
  const { brand, model, year, price, fuel_type, mileage, power, images, status } = vehicle

  const slug = toSlug(brand, model)
  const isPriority = index < 3
  const statusInfo = VEHICLE_STATUS[status] || VEHICLE_STATUS.available

  const mileageLabel = mileage === 0 ? 'Neuf' : mileage ? `${mileage.toLocaleString('fr-FR')} km` : null
  const specs = [year, capitalize(fuel_type), power, mileageLabel].filter(Boolean).join(' · ')

  return (
    <Link to={`/vehicles/${slug}`} className="vcard">
      <div className="vcard-img">
        {images && images[0]
          ? <img
              src={optimizeImageUrl(images[0], 560)}
              alt={`${brand} ${model}`}
              loading={isPriority ? 'eager' : 'lazy'}
              fetchPriority={isPriority ? 'high' : 'auto'}
              decoding={isPriority ? 'sync' : 'async'}
              style={isPriority ? {} : { opacity: 0, transition: 'opacity 0.4s ease' }}
              onLoad={isPriority ? undefined : e => { e.currentTarget.style.opacity = '1' }}
            />
          : <div className="vcard-img-placeholder"></div>
        }
        <span className={`${statusInfo.badge} vcard-badge`}>{statusInfo.label}</span>
      </div>

      <div className="vcard-body">
        <div className="vcard-brand">{brand}</div>
        <div className="vcard-model">{model}</div>
        <div className="vcard-specs">{specs}</div>

        <div className="vcard-footer">
          <div className="vcard-price">
            {formatPrice(price)}
          </div>
          <div className="vcard-arrow">→</div>
        </div>
      </div>
    </Link>
  )
}