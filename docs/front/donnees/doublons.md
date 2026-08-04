← [Les données](README.md)

# Deux doublons à connaître

Rien de cassé, mais autant le savoir avant de tomber dessus.

## 1. Les constantes existent deux fois côté front

`FUEL_TYPES` et `TRANSMISSIONS` sont définis dans `lib/utils.js` **et** dans
`lib/constants.js`. Si tu en modifies un, pense à l'autre.

## 2. Front et back n'écrivent pas les carburants pareil

| | Valeurs |
|---|---|
| `client/src/lib/utils.js` | `['Essence', 'Diesel', 'Hybride', 'Électrique']` |
| `server/constants.js` | `['essence', 'diesel', 'hybride', 'électrique']` |

Les deux listes ne servent pas au même usage — celle du front alimente les menus déroulants,
celle du serveur n'est pas utilisée pour valider `fuel_type` (seul `status` l'est). Aucun
bug aujourd'hui, mais c'est un piège si un jour on ajoute une validation stricte du
carburant côté serveur.

## Et une fonction morte

`invalidateVehiclesCache()` dans `lib/vehiclesCache.js` est exportée mais jamais appelée.
Voir [cache.md](cache.md).
