← [Les données](README.md)

# Les filtres dans l'URL — `pages/Catalogue/`

Les filtres du catalogue vivent dans l'**URL**, pas dans un `useState` :

```text
/catalogue?brand=BMW&sort=price_asc&price_max=90000
```

L'état est lu et écrit avec `useSearchParams()` de React Router. Deux fonctions pures dans
`catalogueFilters.js` font la traduction dans les deux sens :

- `filtersFromParams(params)` → objet de filtres (avec les valeurs par défaut)
- `buildParams(filters, sort, search)` → `URLSearchParams`

**Ce que ça apporte** : une recherche filtrée est partageable par lien, le bouton Précédent
du navigateur fonctionne, et un rafraîchissement de page ne perd rien.

**Le détail soigné** : `buildParams` **n'écrit pas les valeurs par défaut** dans l'URL.
Si les trois statuts sont cochés (l'état initial), le paramètre `status` est omis — l'URL
reste `/catalogue` et non `/catalogue?status=available&status=reserved&status=sold`.

**Le choix assumé** : `page` reste en `useState` local. La pagination est un détail de
consultation, pas un critère de recherche — l'inclure alourdirait l'URL sans bénéfice.

## Deux subtilités du code

`status` est le seul filtre **multi-valeurs** : il apparaît autant de fois qu'il y a de
statuts cochés. D'où `params.getAll('status')` à la lecture et `params.append()` à
l'écriture — `set()` écraserait la valeur précédente à chaque tour de boucle.

`price_max` vaut **`Infinity`** quand aucun plafond n'est choisi. Le filtre s'écrit alors
`v.price <= Infinity`, toujours vrai, sans cas particulier dans `Catalogue.jsx`.

## Où se fait le filtrage

Tout le filtrage, le tri et la pagination du catalogue se font **côté client**, dans des
`useMemo` de `Catalogue.jsx`, sur la liste complète déjà en mémoire. Pas d'aller-retour
réseau à chaque changement de filtre : c'est instantané.

C'est viable parce que le catalogue tient largement en mémoire. Sur une base de plusieurs
milliers de véhicules, il faudrait basculer sur les filtres serveur — que l'API sait déjà
faire, d'ailleurs : `GET /api/vehicles` accepte `status`, `brand`, `fuel_type`, `limit` et
`offset`. Bonne réponse à garder pour le jury.

Les options des menus déroulants sont d'ailleurs déduites des véhicules réellement présents,
pas codées en dur : un filtre ne peut donc jamais proposer un choix qui ne donne aucun
résultat.
