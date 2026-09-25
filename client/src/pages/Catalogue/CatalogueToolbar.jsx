// Recherche et tri du catalogue. Composant contrôlé.

import { useTranslation } from 'react-i18next'

export default function CatalogueToolbar({ search, sort, onSearchChange, onSortChange }) {
  const { t } = useTranslation()

  return (
    <div className="catalogue-toolbar">
      <div className="search-wrap">
        <input
          type="text"
          className="search-input"
          aria-label={t('catalogue.searchAria')}
          placeholder={t('catalogue.searchPlaceholder')}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <select
        className="sort-select"
        aria-label={t('catalogue.sortAria')}
        value={sort}
        onChange={e => onSortChange(e.target.value)}
      >
        {/* Les valeurs restent en anglais : elles partent dans l'URL (?sort=price_asc)
            et ne doivent pas changer avec la langue, sinon un lien partagé casserait. */}
        <option value="default">{t('catalogue.sortDefault')}</option>
        <option value="price_asc">{t('catalogue.sortPriceAsc')}</option>
        <option value="price_desc">{t('catalogue.sortPriceDesc')}</option>
        <option value="year_desc">{t('catalogue.sortYearDesc')}</option>
        <option value="mileage_asc">{t('catalogue.sortMileage')}</option>
      </select>
    </div>
  )
}
