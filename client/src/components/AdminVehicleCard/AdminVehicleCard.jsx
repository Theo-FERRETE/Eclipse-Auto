// Carte véhicule du back-office, même gabarit visuel que le catalogue (.vcard).

import { Link } from 'react-router-dom'
import { optimizeImageUrl, formatPrice } from '@/lib/utils'

export default function AdminVehicleCard({ vehicle: v, onDelete, onStatusChange }) {
  return (
    <div className="vcard admin-vcard">
      <div className="vcard-img">
        {v.images?.[0]
          ? <img
              src={optimizeImageUrl(v.images[0], 400)}
              alt={`${v.brand} ${v.model}`}
              loading="lazy"
              decoding="async"
              style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
              onLoad={e => { e.currentTarget.style.opacity = '1' }}
            />
          : <div className="vcard-img-placeholder"></div>
        }
        <select
          className="status-select vcard-badge"
          value={v.status}
          onChange={e => onStatusChange(v, e.target.value)}
        >
          <option value="available">Disponible</option>
          <option value="reserved">Réservé</option>
          <option value="sold">Vendu</option>
        </select>
      </div>

      <div className="vcard-body">
        <div className="vcard-brand">{v.brand}</div>
        <div className="vcard-model">{v.model}</div>
        <div className="vcard-specs">
          <span>{v.year}</span>
          <span className="spec-dot"></span>
          <span>{v.fuel_type}</span>
        </div>

        <div className="vcard-footer">
          <div className="vcard-price">{formatPrice(v.price)}</div>
          <div className="admin-vcard-actions">
            <Link to={`/admin/vehicles/${v.id}/edit`} className="action-btn edit">Modifier</Link>
            <button className="action-btn delete" onClick={() => onDelete(v.id)}>Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
