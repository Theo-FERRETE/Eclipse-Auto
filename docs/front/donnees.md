← [Front](README.md)

# Front — d'où viennent les données

C'est **le** point qui peut perdre à la lecture du code : le front a deux façons d'obtenir
des données. Elles coexistent volontairement, mais il faut savoir laquelle s'applique où.

## La règle

> **Ce qui est public ou qui ne concerne que moi → Supabase en direct.
> Ce qui concerne les autres ou qui doit être contrôlé → l'API Express.**

```text
┌─ Supabase en direct (clé anon) ─────────────┐   ┌─ API Express (JWT Bearer) ───────────┐
│                                             │   │                                      │
│  • Connexion / inscription / session        │   │  • Créer, annuler une réservation    │
│  • Lecture du catalogue (public)            │   │  • Lister SES réservations           │
│  • Realtime sur le catalogue                │   │  • Toutes les actions admin          │
│  • Lecture + écriture de SON profil         │   │  • Le formulaire de contact          │
│  • Mot de passe oublié / réinitialisé       │   │  • Le catalogue d'équipements        │
└─────────────────────────────────────────────┘   └──────────────────────────────────────┘
```

Chiffre à retenir pour l'oral : il ne reste que **5 appels `.from()` en direct** dans tout
le front (`vehicles` ×2, `profiles` ×3). Tout le reste passe par Express.

### Pourquoi ce partage, et pas « tout par l'API » ?

Faire transiter la lecture du catalogue par Express n'apporterait rien : c'est une donnée
publique, affichée telle quelle sur le site. Passer par un intermédiaire ajouterait une
latence et du code pour zéro gain de sécurité.

À l'inverse, tout ce qui touche à *qui a le droit de faire quoi* doit passer par le serveur,
seul endroit où l'identité peut être vérifiée de façon fiable
(voir [../back/securite.md](../back/securite.md)).

## Le motif d'appel à l'API

Il est identique partout — apprends-le, il revient une douzaine de fois :

```js
const { data: { session } } = await supabase.auth.getSession()
const res = await fetch('/api/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ ... }),
})
if (!res.ok) { /* gestion d'erreur */ }
const data = await res.json()
```

Trois choses à noter :

1. **`getSession()` à chaque fois.** On ne stocke pas le token dans un état React : la
   librairie Supabase le rafraîchit toute seule en arrière-plan, et le relire garantit de
   ne jamais envoyer un token expiré.
2. **Chemin relatif `/api/...`.** Résolu par le proxy Vite en dev, par Express en prod
   (voir [architecture.md](architecture.md#dev-vs-prod--comment-api-est-résolu)).
3. **`res.ok` est testé.** `fetch` ne lève pas d'exception sur une 4xx/5xx — sans ce test,
   une erreur passerait inaperçue.

## Carte des appels API par fichier

| Fichier | Appels |
|---|---|
| `pages/Reservation/Reservation.jsx` | `GET /api/equipements` · `POST /api/reservations` |
| `pages/Dashboard/Dashboard.jsx` | `GET /api/reservations` · `PATCH /api/reservations/:id/cancel` |
| `pages/Contact/Contact.jsx` | `POST /api/contact` |
| `pages/VehicleDetail/VehicleDetail.jsx` | `GET /api/equipements` |
| `pages/admin/AdminDashboard` | `GET /api/admin/stats` |
| `pages/admin/AdminUsers` | `GET /api/admin/clients` · `DELETE /api/admin/clients/:id` |
| `pages/admin/AdminVehicles` | `PUT` et `DELETE /api/vehicles/:id` |
| `pages/admin/AdminReservations` | `GET /api/reservations/all` · `PATCH /api/reservations/:id/status` |
| `pages/admin/AdminEquipements` | `GET /api/equipements` · `DELETE /api/equipements/:id` |
| `lib/vehiclesCache.js` | `GET /api/vehicles/by-slug/:slug` (en secours, cache froid) |

---

## Le cache véhicules — `lib/vehiclesCache.js`

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

### Les quatre fonctions

| Fonction | Rôle |
|---|---|
| `getVehicles()` | Retourne le cache s'il est frais, sinon recharge depuis Supabase |
| `getVehicleBySlug(slug)` | **Si le cache est chaud** : cherche dedans, zéro requête réseau. **Sinon** : appelle `GET /api/vehicles/by-slug/:slug` — un appel ciblé plutôt que recharger tout le catalogue pour une seule fiche |
| `patchCachedVehicle(v)` | Met à jour une entrée du cache sans tout invalider (utilisé par le [Realtime](#le-realtime--pagescataloguecataloguejsx)) |
| `invalidateVehiclesCache()` | Vide tout. ⚠️ **Exportée mais jamais appelée** — c'est du code mort aujourd'hui. Soit on la branche après une modification en back-office, soit on la supprime |

Pourquoi ce cache existe : sans lui, aller du catalogue à une fiche puis revenir
rechargerait la liste complète trois fois.

### Deux détails d'implémentation

Le cache n'est écrit **que si la requête a ramené des données** : en cas d'erreur réseau,
on garde l'ancien contenu plutôt que d'écraser le catalogue avec du vide.

`patchCachedVehicle` **remplace le tableau** au lieu de modifier l'objet en place — React
compare les références, une mutation ne déclencherait aucun rendu. Le TTL n'est pas remis à
zéro pour autant : la ligne reçue est fraîche, mais le reste du cache a toujours le même âge.

### Les trois mécanismes de fraîcheur du catalogue

Ils se complètent :

1. **Le cache 3 min** — évite de recharger inutilement
2. **`window.addEventListener('focus', ...)`** — recharge quand l'utilisateur revient sur
   l'onglet, cas typique où les données ont eu le temps de changer
3. **Le Realtime** — met à jour instantanément pendant qu'il regarde

---

## Le Realtime — `pages/Catalogue/Catalogue.jsx`

C'est la seule utilisation du Realtime Supabase du projet.

```js
const channel = supabase
  .channel('catalogue-vehicles')
  .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'vehicles' },
      payload => {
        patchCachedVehicle(payload.new)
        setVehicles(prev => prev.map(v => v.id === payload.new.id ? { ...v, ...payload.new } : v))
      })
  .subscribe()
```

**Ce que ça fait** : Supabase ouvre un **WebSocket** et pousse au navigateur chaque `UPDATE`
sur la table `vehicles`. Concrètement, quand l'admin confirme une réservation, le véhicule
passe `available` → `reserved` (via le trigger PostgreSQL) et le badge change **en direct**
sur l'écran de tous les visiteurs, sans rechargement.

**Pourquoi seulement `UPDATE`** : ce qui intéresse le catalogue, ce sont les changements de
statut. Un ajout ou une suppression de véhicule est une action de back-office, plus rare, et
qui sera reprise au prochain chargement.

### Le nettoyage est obligatoire

Le `return` du `useEffect` fait `removeEventListener` + `supabase.removeChannel(channel)`.
Sans ce nettoyage, chaque visite du catalogue ouvrirait un WebSocket de plus, jamais fermé —
une fuite classique.

### Le lien avec la CSP

Le Realtime passe par `wss://` et non par du HTTP. C'est pour ça que la CSP du serveur doit
autoriser explicitement ce protocole, sinon le navigateur bloque la connexion en production.
Voir [../back/securite.md](../back/securite.md#la-csp-content-security-policy--le-piège-de-production).

---

## Les filtres dans l'URL — `pages/Catalogue/`

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

### Deux subtilités du code

`status` est le seul filtre **multi-valeurs** : il apparaît autant de fois qu'il y a de
statuts cochés. D'où `params.getAll('status')` à la lecture et `params.append()` à
l'écriture — `set()` écraserait la valeur précédente à chaque tour de boucle.

`price_max` vaut **`Infinity`** quand aucun plafond n'est choisi. Le filtre s'écrit alors
`v.price <= Infinity`, toujours vrai, sans cas particulier dans `Catalogue.jsx`.

### Où se fait le filtrage

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

---

## Deux doublons à connaître

Rien de cassé, mais autant le savoir avant de tomber dessus.

### 1. Les constantes existent deux fois côté front

`FUEL_TYPES` et `TRANSMISSIONS` sont définis dans `lib/utils.js` **et** dans
`lib/constants.js`. Si tu en modifies un, pense à l'autre.

### 2. Front et back n'écrivent pas les carburants pareil

| | Valeurs |
|---|---|
| `client/src/lib/utils.js` | `['Essence', 'Diesel', 'Hybride', 'Électrique']` |
| `server/constants.js` | `['essence', 'diesel', 'hybride', 'électrique']` |

Les deux listes ne servent pas au même usage — celle du front alimente les menus déroulants,
celle du serveur n'est pas utilisée pour valider `fuel_type` (seul `status` l'est). Aucun
bug aujourd'hui, mais c'est un piège si un jour on ajoute une validation stricte du
carburant côté serveur.

### Et une fonction morte

`invalidateVehiclesCache()` dans `lib/vehiclesCache.js` est exportée mais jamais appelée.
Voir [le cache véhicules](#le-cache-véhicules--libvehiclescachejs).
