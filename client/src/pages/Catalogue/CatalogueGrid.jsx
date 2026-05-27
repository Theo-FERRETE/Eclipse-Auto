import VehicleCard from '@/components/VehicleCard/VehicleCard'
import Pagination from '@/components/Pagination/Pagination'

export default function CatalogueGrid({ loading, error, paginated, page, itemsPerPage, totalPages, onPageChange, onReset }) {
  if (loading) return (
    <div className="catalogue-loading">
      <div className="loader"></div>
      <p>Chargement des véhicules...</p>
    </div>
  )

  if (error) return (
    <div className="catalogue-error">
      <p>Erreur : {error}</p>
    </div>
  )

  return (
    <>
      {paginated.length === 0 ? (
        <div className="catalogue-empty">
          <p>Aucun véhicule ne correspond à vos critères.</p>
          <button className="btn-ghost" onClick={onReset}>Réinitialiser les filtres</button>
        </div>
      ) : (
        <div className="catalogue-grid">
          {paginated.map((vehicle, i) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              index={(page - 1) * itemsPerPage + i}
            />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  )
}
