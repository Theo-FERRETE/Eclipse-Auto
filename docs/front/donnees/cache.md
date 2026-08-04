← [Les données](README.md)

# Le cache véhicules — `lib/vehiclesCache.js`

Le catalogue est chargé une fois et gardé **3 minutes** dans une variable de module.

```js
let _cache = null
let _cacheTime = 0
const TTL = 3 * 60 * 1000
```

Ce sont des **variables de module** : elles existent en un seul exemplaire pour tout
l'onglet, quel que soit le nombre de composants qui importent le fichier. C'est ce qui rend
le cache réellement partagé entre l'accueil, le catalogue et les fiches véhicule.

C'est un cache **en mémoire de l'onglet** : il disparaît au rechargement de la page. Pas de
`localStorage` — pour une donnée qui bouge (les statuts de véhicules), un cache persistant
afficherait des informations périmées au retour de l'utilisateur.

## Les quatre fonctions

| Fonction | Rôle |
|---|---|
| `getVehicles()` | Retourne le cache s'il est frais, sinon recharge depuis Supabase |
| `getVehicleBySlug(slug)` | **Si le cache est chaud** : cherche dedans, zéro requête réseau. **Sinon** : appelle `GET /api/vehicles/by-slug/:slug` — un appel ciblé plutôt que recharger tout le catalogue pour une seule fiche |
| `patchCachedVehicle(v)` | Met à jour une entrée du cache sans tout invalider (utilisé par le [Realtime](realtime.md)) |
| `invalidateVehiclesCache()` | Vide tout. ⚠️ **Exportée mais jamais appelée** — c'est du code mort aujourd'hui. Soit on la branche après une modification en back-office, soit on la supprime |

Pourquoi ce cache existe : sans lui, aller du catalogue à une fiche puis revenir
rechargerait la liste complète trois fois.

## Deux détails d'implémentation

Le cache n'est écrit **que si la requête a ramené des données** : en cas d'erreur réseau,
on garde l'ancien contenu plutôt que d'écraser le catalogue avec du vide.

`patchCachedVehicle` **remplace le tableau** au lieu de modifier l'objet en place — React
compare les références, une mutation ne déclencherait aucun rendu. Le TTL n'est pas remis à
zéro pour autant : la ligne reçue est fraîche, mais le reste du cache a toujours le même âge.

## Les trois mécanismes de fraîcheur du catalogue

Ils se complètent :

1. **Le cache 3 min** — évite de recharger inutilement
2. **`window.addEventListener('focus', ...)`** — recharge quand l'utilisateur revient sur
   l'onglet, cas typique où les données ont eu le temps de changer
3. **Le [Realtime](realtime.md)** — met à jour instantanément pendant qu'il regarde
