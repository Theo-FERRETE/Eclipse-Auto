// Accueil : hero, marquee de marques, 3 véhicules mis en avant. Lit le cache partagé.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toSlug, optimizeImageUrl, formatPrice, capitalize } from '@/lib/utils'
import { getVehicles } from '@/lib/vehiclesCache'
import './Home.css'

export default function Home() {
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    getVehicles().then(({ data }) => {
      if (data) setFeatured(data.slice(0, 3))
    })
  }, [])

  return (
    <main className="home">

      <section className="hero">
        <div className="hero-bg"></div>

        <div className="hero-content">
          <div className="tag" style={{ color: 'var(--cyan)' }}>Collection 2026</div>
          <h1 className="hero-title">
            Conduisez<br />l'exception<em>.</em>
          </h1>
          <p className="hero-sub">
            Une sélection rigoureuse de voitures de sport d'exception, choisies pour leur caractère autant que pour leurs performances.
          </p>
          <div className="hero-btns">
            <Link to="/catalogue" className="btn-primary">
              Découvrir le catalogue
            </Link>
            <Link to="/contact" className="btn-ghost">
              Prendre rendez-vous
            </Link>
          </div>
        </div>
      </section>

      <div className="brand-marquee">
        <div className="page-section brand-marquee-row">
          {['Ferrari', 'Lamborghini', 'Aston Martin', 'BMW', 'Lotus', 'Jaguar'].map(brand => (
            <span key={brand}>{brand}</span>
          ))}
        </div>
      </div>

      <section className="section featured">
        <div className="page-section">
          <div className="section-header">
            <div>
              <div className="tag">Sélection du moment</div>
              <h2 className="section-title">Véhicules en vedette</h2>
            </div>
            <Link to="/catalogue" className="section-header-link">
              Voir tout le catalogue →
            </Link>
          </div>

          <div className="featured-grid">
            {featured.map((car, i) => (
              <div className="featured-card" key={car.id}>
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
                  <div className="tag" style={{ color: 'var(--cyan)' }}>{car.brand}</div>
                  <div className="car-model">{car.model}</div>
                  <div className="car-specs">
                    {[car.year, car.power, capitalize(car.fuel_type)].filter(Boolean).join(' · ')}
                  </div>
                  <div className="car-footer">
                    <div className="car-price">
                      {formatPrice(car.price)}
                    </div>
                    <Link
                      to={`/vehicles/${toSlug(car.brand, car.model)}`}
                      className="car-link"
                      aria-label={`Voir ${car.brand} ${car.model}`}
                    >
                      Voir →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section why">
        <div className="page-section">
          <div className="section-header">
            <div className="tag">Pourquoi nous</div>
            <h2 className="section-title">L'excellence au service<br />de la performance</h2>
          </div>
          <div className="why-grid">
            {[
              { num: '01', title: 'Sélection rigoureuse', desc: 'Chaque véhicule est inspecté et certifié avant d\'intégrer notre catalogue.' },
              { num: '02', title: 'Réservation en ligne', desc: 'Réservez un essai ou lancez un achat en quelques clics, 24h/24.' },
              { num: '03', title: 'Expertise reconnue', desc: '12 ans d\'expérience dans la vente de véhicules de sport haut de gamme.' },
            ].map((item) => (
              <div className="why-card" key={item.num}>
                <div className="why-num">{item.num}</div>
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