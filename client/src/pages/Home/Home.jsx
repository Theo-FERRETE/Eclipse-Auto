import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toSlug, optimizeImageUrl, formatPrice } from '@/lib/utils'
import { getVehicles } from '@/lib/vehiclesCache'
import './Home.css'

const YEARS_EXPERTISE = 12
const SATISFACTION_PCT = 100

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [vehicleCount, setVehicleCount] = useState(null)

  useEffect(() => {
    getVehicles().then(({ data }) => {
      if (data) {
        setFeatured(data.slice(0, 3))
        setVehicleCount(data.length)
      }
    })
  }, [])

  return (
    <main className="home">

      <section className="hero">
        <div className="hero-bg">
          <div className="hero-line-h"></div>
          <div className="hero-line-v"></div>
        </div>

        <div className="container hero-content">
          <div className="tag">Collection 2026</div>
          <h1 className="hero-title">
            Conduisez<br />
            <em>l'exception</em>
          </h1>
          <p className="hero-sub">
            Voitures de sport d'exception — sélection premium
          </p>
          <div className="hero-btns">
            <Link to="/catalogue" className="btn-primary">
              Voir le catalogue
            </Link>
            <Link to="/contact" className="btn-ghost">
              Prendre RDV
            </Link>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-n">{vehicleCount ?? '—'}<em>+</em></span>
            <span className="stat-l">Véhicules</span>
          </div>
          <div className="stat">
            <span className="stat-n">{YEARS_EXPERTISE}<em>ans</em></span>
            <span className="stat-l">D'expertise</span>
          </div>
          <div className="stat">
            <span className="stat-n">{SATISFACTION_PCT}<em>%</em></span>
            <span className="stat-l">Satisfaction</span>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="section featured">
        <div className="container">
          <div className="section-header">
            <div className="tag">Sélection du moment</div>
            <h2 className="section-title">Véhicules en vedette</h2>
          </div>

          <div className="featured-grid">
            {featured.map((car, i) => {
              const statusBadge = {
                available: <span className="badge-available">Disponible</span>,
                reserved: <span className="badge-reserved">Réservé</span>,
                sold: <span className="badge-sold">Vendu</span>,
              }
              return (
                <div className="featured-card" key={car.id}>
                  <div className="featured-card-top">
                    <span className="car-num">{String(i + 1).padStart(2, '0')}</span>
                    {statusBadge[car.status] || statusBadge.available}
                  </div>
                  <div className="featured-card-img">
                    {car.images && car.images[0]
                      ? <img
                          src={optimizeImageUrl(car.images[0], 420)}
                          alt={`${car.brand} ${car.model}`}
                          loading="eager"
                          fetchPriority={i === 0 ? 'high' : 'auto'}
                          decoding="sync"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      : null
                    }
                  </div>
                  <div className="featured-card-body">
                    <div className="car-brand">{car.brand}</div>
                    <div className="car-model">{car.model}</div>
                    <div className="car-specs">
                      <span>{car.year}</span>
                      {car.power && <><span className="spec-dot"></span><span>{car.power}</span></>}
                      {car.fuel_type && <><span className="spec-dot"></span><span>{car.fuel_type}</span></>}
                    </div>
                    <div className="car-footer">
                      <div className="car-price">
                        {formatPrice(car.price)}
                      </div>
                      <Link to={`/vehicles/${toSlug(car.brand, car.model)}`} className="btn-cyan" style={{ padding: '8px 18px', fontSize: '11px' }}>
                        Voir
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="featured-cta">
            <Link to="/catalogue" className="btn-ghost">
              Voir tout le catalogue
            </Link>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="section why">
        <div className="container">
          <div className="section-header">
            <div className="tag">Pourquoi nous</div>
            <h2 className="section-title">L'excellence au service<br />de la performance</h2>
          </div>
          <div className="why-grid">
            {[
              { num: '01', title: 'Sélection rigoureuse', desc: 'Chaque véhicule est inspecté et certifié avant d\'intégrer notre catalogue.' },
              { num: '02', title: 'Réservation en ligne', desc: 'Réservez votre voiture de sport en quelques clics, 24h/24.' },
              { num: '03', title: 'Expertise reconnue', desc: '12 ans d\'expérience dans la vente de véhicules de sport haut de gamme.' },
            ].map((item) => (
              <div className="why-card" key={item.num}>
                <div className="why-num">{item.num}</div>
                <div className="why-line"></div>
                <h3 className="why-title">{item.title}</h3>
                <p className="why-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}