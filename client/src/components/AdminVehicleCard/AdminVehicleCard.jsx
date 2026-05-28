import { optimizeImageUrl, formatPrice } from '@/lib/utils'

export default function AdminVehicleCard({ vehicle: v, editing, onEdit, onDelete, onStatusChange }) {
  return (
    <div className={`admin-vehicle-card ${editing === v.id ? 'active' : ''}`}>
      <div className="avc-img">
        {v.images?.[0]
          ? <img
              src={optimizeImageUrl(v.images[0], 200)}
              alt={`${v.brand} ${v.model}`}
              loading="lazy"
              decoding="async"
              style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
              onLoad={e => { e.currentTarget.style.opacity = '1' }}
            />
          : <div className="avc-img-placeholder"></div>
        }
        <div className="gallery-bar"></div>
      </div>
      <div className="avc-info">
        <div className="vcard-brand">{v.brand}</div>
        <div className="avc-model">{v.model}</div>
        <div className="vcard-specs">
          <span>{v.year}</span>
          <span className="spec-dot"></span>
          <span>{v.fuel_type}</span>
        </div>
      </div>
      <div className="avc-right">
        <div className="avc-price">{formatPrice(v.price)}</div>
        <select
          className="status-select"
          value={v.status}
          onChange={e => onStatusChange(v, e.target.value)}
        >
          <option value="available">Disponible</option>
          <option value="reserved">Réservé</option>
          <option value="sold">Vendu</option>
        </select>
        <div className="avc-actions">
          <button className="action-btn edit" onClick={() => onEdit(v)}>Modifier</button>
          <button className="action-btn delete" onClick={() => onDelete(v.id)}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}
