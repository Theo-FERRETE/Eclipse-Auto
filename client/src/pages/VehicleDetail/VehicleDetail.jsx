// Fiche véhicule (/vehicles/:slug). Deux parcours distincts : essai (gratuit, sans options)
// et achat (avec options, sur la page /achat/:slug).

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { optimizeImageUrl, formatPrice, capitalize, VEHICLE_STATUS } from '@/lib/utils'
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

  const mainSpecs = [
    { label: 'Carburant', value: capitalize(fuel_type) || 'N/A' },
    { label: 'Transmission', value: capitalize(transmission) || 'N/A' },
    { label: 'Kilométrage', value: mileage === 0 ? 'Neuf' : mileage ? `${mileage.toLocaleString('fr-FR')} km` : 'N/A' },
    { label: 'Puissance', value: power ? `${power} ch` : 'N/A' },
  ]

  return (
    <main className="detail">
      <div className="detail-hero">
        {images && images[activeImg]
          ? <img
              className="detail-hero-img"
              src={optimizeImageUrl(images[activeImg], 1600)}
              alt={`${year} ${brand} ${model}`}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          : <div className="detail-hero-placeholder"></div>
        }
        <div className="detail-hero-overlay"></div>

        <Link to="/catalogue" className="detail-hero-back">
          ← Retour au catalogue
        </Link>

        <div className="detail-hero-content">
          <div>
            <div className="tag" style={{ color: 'var(--cyan)' }}>{brand}</div>
            <h1 className="detail-title">{model}</h1>
          </div>
          <div className="detail-hero-meta">
            <div className="tag">{year}</div>
            <div className="detail-price">{formatPrice(price)}</div>
            <span className={statusInfo.badge}>{statusInfo.label}</span>
          </div>
        </div>

        {images && images.length > 1 && (
          <div className="detail-hero-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                className={`detail-hero-thumb ${i === activeImg ? 'active' : ''}`}
                onClick={() => setActiveImg(i)}
                aria-label={`Voir l'image ${i + 1}`}
              >
                <img
                  src={optimizeImageUrl(img, 160)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="page-section detail-body">
        <div className="detail-main">
          <div className="tag">Caractéristiques</div>
          <div className="detail-spec-grid">
            {mainSpecs.map((spec, i) => (
              <div className="detail-spec-item" key={i}>
                <div className="detail-spec-value">{spec.value}</div>
                <div className="detail-spec-label">{spec.label}</div>
              </div>
            ))}
          </div>

          {description && (
            <p className="detail-description">{description}</p>
          )}
        </div>

        <div className="detail-actions">
          {/* Un essai suppose le véhicule libre ; l'achat reste possible même s'il est en
              cours d'essai ('reserved'), seul 'sold' le bloque (voir venteController.create). */}
          {status === 'available' && (
            <button onClick={() => navigate(`/reserve/${slug}`)} className="btn-primary">
              Réserver un essai
            </button>
          )}
          {status !== 'sold' ? (
            <button
              onClick={() => navigate(`/achat/${slug}`)}
              className={status === 'available' ? 'btn-ghost' : 'btn-primary'}
            >
              Acheter
            </button>
          ) : (
            <button className="btn-ghost" disabled style={{ opacity: 0.5 }}>
              Véhicule vendu
            </button>
          )}
          <Link to="/contact" className="btn-ghost">
            Nous contacter
          </Link>
        </div>
      </div>
    </main>
  )
}
