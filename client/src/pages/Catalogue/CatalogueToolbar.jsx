export default function CatalogueToolbar({ search, sort, onSearchChange, onSortChange }) {
  return (
    <div className="catalogue-toolbar">
      <div className="search-wrap">
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher une marque, un modèle..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <select
        className="sort-select"
        value={sort}
        onChange={e => onSortChange(e.target.value)}
      >
        <option value="default">Trier par défaut</option>
        <option value="price_asc">Prix croissant</option>
        <option value="price_desc">Prix décroissant</option>
        <option value="year_desc">Année récente</option>
        <option value="mileage_asc">Kilométrage</option>
      </select>
    </div>
  )
}
