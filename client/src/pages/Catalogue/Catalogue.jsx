import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Filters from '@/components/Filters/Filters'
import { supabase } from '@/lib/supabase'
import { getVehicles, patchCachedVehicle } from '@/lib/vehiclesCache'
import { DEFAULT_STATUS, ITEMS_PER_PAGE, filtersFromParams, buildParams } from './catalogueFilters'
import CatalogueToolbar from './CatalogueToolbar'
import CatalogueGrid from './CatalogueGrid'
import './Catalogue.css'

export default function Catalogue() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = filtersFromParams(searchParams)
  const sort = searchParams.get('sort') || 'default'
  const search = searchParams.get('q') || ''

  useEffect(() => {
    async function fetchVehicles() {
      const { data, error } = await getVehicles()
      if (error) setError('Impossible de charger les véhicules.')
      else setVehicles(data)
      setLoading(false)
    }

    fetchVehicles()
    window.addEventListener('focus', fetchVehicles)

    const channel = supabase
      .channel('catalogue-vehicles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vehicles' }, payload => {
        patchCachedVehicle(payload.new)
        setVehicles(prev => prev.map(v => v.id === payload.new.id ? { ...v, ...payload.new } : v))
      })
      .subscribe()

    return () => {
      window.removeEventListener('focus', fetchVehicles)
      supabase.removeChannel(channel)
    }
  }, [])

  function handleFilterChange(key, value) {
    setSearchParams(buildParams({ ...filters, [key]: value }, sort, search))
    setPage(1)
  }

  function handleReset() {
    setSearchParams(new URLSearchParams())
    setPage(1)
  }

  const brands = useMemo(() =>
    [...new Set(vehicles.map(v => v.brand).filter(Boolean))].sort()
  , [vehicles])

  const fuelTypes = useMemo(() =>
    [...new Set(vehicles.map(v => v.fuel_type).filter(Boolean))].sort()
  , [vehicles])

  const transmissions = useMemo(() =>
    [...new Set(vehicles.map(v => v.transmission).filter(Boolean))].sort()
  , [vehicles])

  const priceMax = useMemo(() =>
    vehicles.length ? Math.max(...vehicles.map(v => v.price || 0)) : null
  , [vehicles])

  const filtered = useMemo(() => {
    let result = [...vehicles]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(v =>
        v.brand.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
      )
    }
    if (filters.brand) result = result.filter(v => v.brand === filters.brand)
    if (filters.fuel_type) result = result.filter(v => v.fuel_type === filters.fuel_type)
    if (filters.transmission) result = result.filter(v => v.transmission === filters.transmission)
    if (filters.year_min) result = result.filter(v => v.year >= Number(filters.year_min))
    if (filters.status.length) result = result.filter(v => filters.status.includes(v.status))
    if (filters.price_max !== Infinity) result = result.filter(v => v.price <= Number(filters.price_max))
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
        <Filters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          brands={brands}
          fuelTypes={fuelTypes}
          transmissions={transmissions}
          priceMax={priceMax}
        />
        <div className="catalogue-main">
          <CatalogueToolbar
            search={search}
            sort={sort}
            onSearchChange={value => { setSearchParams(buildParams(filters, sort, value)); setPage(1) }}
            onSortChange={value => { setSearchParams(buildParams(filters, value, search)); setPage(1) }}
          />
          <CatalogueGrid
            loading={loading}
            error={error}
            paginated={paginated}
            page={page}
            itemsPerPage={ITEMS_PER_PAGE}
            totalPages={totalPages}
            onPageChange={setPage}
            onReset={handleReset}
          />
        </div>
      </div>
    </main>
  )
}
