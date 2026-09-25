// Grille de résultats : chargement, erreur, vide, liste, pagination.

import { useTranslation } from 'react-i18next'
import VehicleCard from '@/components/VehicleCard/VehicleCard'
import Pagination from '@/components/Pagination/Pagination'

export default function CatalogueGrid({ loading, error, paginated, page, itemsPerPage, totalPages, onPageChange, onReset }) {
  const { t } = useTranslation()

  if (loading) return (
    <div className="catalogue-loading">
      <div className="loader"></div>
      <p>{t('catalogue.loading')}</p>
    </div>
  )

  // `error` est un booléen et non un message : stocker du texte traduit dans l'état le
  // figerait dans la langue du moment de l'erreur.
  if (error) return (
    <div className="catalogue-error">
      <p>{t('catalogue.errorPrefix', { message: t('catalogue.loadError') })}</p>
    </div>
  )

  return (
    <>
      {paginated.length === 0 ? (
        <div className="catalogue-empty">
          <p>{t('catalogue.empty')}</p>
          <button className="btn-ghost" onClick={onReset}>{t('catalogue.emptyReset')}</button>
        </div>
      ) : (
        <div className="card-grid">
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
