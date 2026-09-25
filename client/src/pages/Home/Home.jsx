// Accueil : hero, marquee de marques, 3 véhicules mis en avant. Lit le cache partagé.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toSlug, optimizeImageUrl, formatPrice, translateFuel } from '@/lib/utils'
import { getVehicles } from '@/lib/vehiclesCache'
import './Home.css'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const { t } = useTranslation()

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
          <div className="tag" style={{ color: 'var(--cyan)' }}>{t('home.heroTag')}</div>
          <h1 className="hero-title">
            {t('home.heroTitleLine1')}<br />{t('home.heroTitleLine2')}<em>.</em>
          </h1>
          <p className="hero-sub">
            {t('home.heroSub')}
          </p>
          <div className="hero-btns">
            <Link to="/catalogue" className="btn-primary">
              {t('home.heroCtaCatalogue')}
            </Link>
            <Link to="/contact" className="btn-ghost">
              {t('home.heroCtaContact')}
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
              <div className="tag">{t('home.featuredTag')}</div>
              <h2 className="section-title">{t('home.featuredTitle')}</h2>
            </div>
            <Link to="/catalogue" className="section-header-link">
              {t('home.featuredLink')}
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
                    {[car.year, car.power, translateFuel(car.fuel_type)].filter(Boolean).join(' · ')}
                  </div>
                  <div className="car-footer">
                    <div className="car-price">
                      {formatPrice(car.price)}
                    </div>
                    <Link
                      to={`/vehicles/${toSlug(car.brand, car.model)}`}
                      className="car-link"
                      aria-label={t('home.viewVehicleAria', { vehicle: `${car.brand} ${car.model}` })}
                    >
                      {t('home.viewVehicle')}
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
            <div className="tag">{t('home.whyTag')}</div>
            <h2 className="section-title">{t('home.whyTitleLine1')}<br />{t('home.whyTitleLine2')}</h2>
          </div>
          <div className="why-grid">
            {['1', '2', '3'].map((n) => (
              <div className="why-card" key={n}>
                <div className="why-num">{`0${n}`}</div>
                <h3 className="why-title">{t(`home.why${n}Title`)}</h3>
                <p className="why-desc">{t(`home.why${n}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
