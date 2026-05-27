import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { optimizeImageUrl, formatPrice, VEHICLE_STATUS } from '@/lib/utils'
import { getVehicleBySlug } from '@/lib/vehiclesCache'
import './VehicleDetail.css'

export default function VehicleDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    async function fetchVehicle() {
      setLoading(true)
      const { data, error } = await getVehicleBySlug(slug)

      if (error || !data) {
        navigate('/catalogue')
        return
      }

      setVehicle(data)
      setLoading(false)
    }
    fetchVehicle()
  }, [slug, navigate])

  if (loading) {
    return (
      <main className="detail-loading">
        <div className="loader"></div>
      </main>
    )
  }

  if (!vehicle) return null

  const {
    brand, model, year, price, fuel_type,
    transmission, mileage, power, description,
    images, status
  } = vehicle

  const statusInfo = VEHICLE_STATUS[status] || VEHICLE_STATUS.available

  const specs = [
    { label: 'Année', value: year },
    { label: 'Carburant', value: fuel_type },
    { label: 'Transmission', value: transmission },
    { label: 'Kilométrage', value: mileage === 0 ? 'Neuf' : mileage ? `${mileage.toLocaleString('fr-FR')} km` : 'N/A' },
    { label: 'Puissance', value: power || 'N/A' },
    { label: 'Statut', value: <span className={statusInfo.badge}>{statusInfo.label}</span> },
  ]

  return (
    <main className="detail">
      <div className="detail-breadcrumb">
        <div className="container">
          <Link to="/catalogue" className="breadcrumb-back">
            ← Retour au catalogue
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{brand} {model}</span>
        </div>
      </div>

      <div className="container detail-layout">
        <div className="detail-gallery">
          <div className="gallery-main">
            {images && images[activeImg]
              ? <img
                  src={optimizeImageUrl(images[activeImg], 1200)}
                  alt={`${year} ${brand} ${model}`}
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                  onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
                />
              : null
            }
            <div className="gallery-placeholder" style={images && images[activeImg] ? { display: 'none' } : {}}></div>
            <div className="gallery-bar"></div>
          </div>

          {images && images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`gallery-thumb ${i === activeImg ? 'active' : ''}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img
                    src={optimizeImageUrl(img, 200)}
                    alt={`${brand} ${model}, image ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                    onLoad={e => { e.currentTarget.style.opacity = '1' }}
                    onError={e => { e.currentTarget.parentElement.style.opacity = '0.3' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <div className="detail-header">
            <div className="tag">{brand}</div>
            <h1 className="detail-title">{model}</h1>
            <div className="detail-year">{year}</div>
          </div>

          <div className="detail-price-block">
            <div className="detail-price">
              {formatPrice(price)}
            </div>
            <span className={statusInfo.badge}>{statusInfo.label}</span>
          </div>

          <div className="detail-specs">
            {specs.map((spec, i) => (
              <div className="spec-row" key={i}>
                <span className="spec-label">{spec.label}</span>
                <span className="spec-value">{spec.value}</span>
              </div>
            ))}
          </div>

          {description && (
            <div className="detail-description">
              <div className="desc-label">Description</div>
              <p>{description}</p>
            </div>
          )}

          <div className="detail-actions">
            {status === 'available' ? (
              <Link
                to={`/reserve/${slug}`}
                className="btn-primary"
                style={{ display: 'block', textAlign: 'center' }}
              >
                Réserver ce véhicule
              </Link>
            ) : (
              <button
                className="btn-ghost"
                disabled
                style={{ width: '100%', opacity: 0.5 }}
              >
                {status === 'reserved' ? 'Véhicule réservé' : 'Véhicule vendu'}
              </button>
            )}
            <Link
              to="/contact"
              className="btn-ghost"
              style={{ display: 'block', textAlign: 'center' }}
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}