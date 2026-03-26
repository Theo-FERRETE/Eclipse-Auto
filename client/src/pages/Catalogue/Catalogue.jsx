import { useState, useMemo, useEffect } from 'react'
import VehicleCard from '@/components/VehicleCard/VehicleCard'
import Filters from '@/components/Filters/Filters'
import { supabase } from '@/lib/supabase'
import './Catalogue.css'

const INITIAL_FILTERS = {
  brand: '',
  fuel_type: '',
  transmission: '',
  price_max: 700000,
  year_min: '',
  status: ['available', 'reserved', 'sold'],
}

const ITEMS_PER_PAGE = 6

export default function Catalogue() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [sort, setSort] = useState('default')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true)
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setVehicles(data)
      }
      setLoading(false)
    }
    fetchVehicles()
  }, [])

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS)
    setSearch('')
    setSort('default')
    setPage(1)
  }

  const filtered = useMemo(() => {
    let result = [...vehicles]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(v =>
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
      )
    }
    if (filters.brand) result = result.filter(v => v.brand === filters.brand)
    if (filters.fuel_type) result = result.filter(v => v.fuel_type === filters.fuel_type)
    if (filters.transmission) result = result.filter(v => v.transmission === filters.transmission)
    if (filters.year_min) result = result.filter(v => v.year >= Number(filters.year_min))
    if (filters.status.length) result = result.filter(v => filters.status.includes(v.status))
    result = result.filter(v => v.price <= Number(filters.price_max))

    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') result.sort((a, b) => b.price - a.price)
    if (sort === 'year_desc') result.sort((a, b) => b.year - a.year)
    if (sort === 'mileage_asc') result.sort((a, b) => a.mileage - b.mileage)

    return result
  }, [vehicles, filters, sort, search])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <main className="catalogue">
      <div className="catalogue-hero">
        <div className="container">
          <div className="tag">Notre sélection</div>
          <h1 className="catalogue-title">Catalogue</h1>
          <p className="catalogue-sub">
            {loading ? 'Chargement...' : `${filtered.length} véhicule${filtered.length > 1 ? 's' : ''} trouvé${filtered.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="divider"></div>

      <div className="container catalogue-layout">
        <Filters filters={filters} onChange={handleFilterChange} onReset={handleReset} />

        <div className="catalogue-main">
          <div className="catalogue-toolbar">
            <div className="search-wrap">
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher une marque, un modèle..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <select
              className="sort-select"
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
            >
              <option value="default">Trier par défaut</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="year_desc">Année récente</option>
              <option value="mileage_asc">Kilométrage</option>
            </select>
          </div>

          {loading && (
            <div className="catalogue-loading">
              <div className="loader"></div>
              <p>Chargement des véhicules...</p>
            </div>
          )}

          {error && (
            <div className="catalogue-error">
              <p>Erreur : {error}</p>
            </div>
          )}

          {!loading && !error && paginated.length === 0 && (
            <div className="catalogue-empty">
              <p>Aucun véhicule ne correspond à vos critères.</p>
              <button className="btn-ghost" onClick={handleReset}>
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {!loading && !error && paginated.length > 0 && (
            <div className="catalogue-grid">
              {paginated.map((vehicle, i) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  index={(page - 1) * ITEMS_PER_PAGE + i}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}