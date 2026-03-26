import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
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
            <span className="stat-n">48<em>+</em></span>
            <span className="stat-l">Véhicules</span>
          </div>
          <div className="stat">
            <span className="stat-n">12<em>ans</em></span>
            <span className="stat-l">D'expertise</span>
          </div>
          <div className="stat">
            <span className="stat-n">100<em>%</em></span>
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
            {[
              { num: '01', brand: 'Ferrari', model: 'Roma Spider', year: 2024, power: '620 CH', speed: '320 km/h', price: '248 000' },
              { num: '02', brand: 'Lamborghini', model: 'Huracán EVO', year: 2023, power: '640 CH', speed: '325 km/h', price: '265 000' },
              { num: '03', brand: 'Porsche', model: '911 GT3', year: 2024, power: '510 CH', speed: '318 km/h', price: '189 000' },
            ].map((car) => (
              <div className="featured-card" key={car.num}>
                <div className="featured-card-top">
                  <span className="car-num">{car.num}</span>
                  <span className="badge-available">Disponible</span>
                </div>
                <div className="featured-card-img"></div>
                <div className="featured-card-body">
                  <div className="car-brand">{car.brand}</div>
                  <div className="car-model">{car.model}</div>
                  <div className="car-specs">
                    <span>{car.year}</span>
                    <span className="spec-dot"></span>
                    <span>{car.power}</span>
                    <span className="spec-dot"></span>
                    <span>{car.speed}</span>
                  </div>
                  <div className="car-footer">
                    <div className="car-price">€ {car.price}</div>
                    <Link to="/catalogue" className="btn-cyan" style={{ padding: '8px 18px', fontSize: '11px' }}>
                      Voir
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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