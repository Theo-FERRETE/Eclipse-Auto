import { Link } from 'react-router-dom'
import './VehicleCard.css'

export default function VehicleCard({ vehicle, index }) {
  const { id, brand, model, year, price, fuel_type, mileage, power, images, status } = vehicle

  const badge = {
    available: <span className="badge-available">Disponible</span>,
    reserved: <span className="badge-reserved">Réservé</span>,
    sold: <span className="badge-sold">Vendu</span>,
  }

  return (
    <Link to={`/vehicles/${id}`} className="vcard">
      <div className="vcard-top">
        <span className="vcard-num">{String(index + 1).padStart(2, '0')}</span>
        {badge[status] || badge.available}
      </div>

      <div className="vcard-img">
        {images && images[0]
          ? <img src={images[0]} alt={`${brand} ${model}`} />
          : <div className="vcard-img-placeholder"></div>
        }
        <div className="vcard-img-bar"></div>
      </div>

      <div className="vcard-body">
        <div className="vcard-brand">{brand}</div>
        <div className="vcard-model">{model}</div>

        <div className="vcard-specs">
          <span>{year}</span>
          {fuel_type && (
            <>
              <span className="spec-dot"></span>
              <span>{fuel_type}</span>
            </>
          )}
          {power && (
            <>
              <span className="spec-dot"></span>
              <span>{power}</span>
            </>
          )}
        </div>

        {mileage !== undefined && mileage !== null && (
          <div className="vcard-mileage">
            {mileage === 0 ? 'Neuf' : `${mileage.toLocaleString('fr-FR')} km`}
          </div>
        )}

        <div className="vcard-footer">
          <div className="vcard-price">
            {price ? `€ ${price.toLocaleString('fr-FR')}` : 'Prix sur demande'}
          </div>
          <div className="vcard-arrow">→</div>
        </div>
      </div>
    </Link>
  )
}