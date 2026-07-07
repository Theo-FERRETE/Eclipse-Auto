# Fiches de révision — Eclipse Auto (essentiel)

React (useState/useEffect/props en détail, exemples de code) → [fiches-revision-react.md](fiches-revision-react.md)
SQL (requêtes sur le vrai schéma Supabase, jointures, agrégations, triggers) → [fiches-revision-sql.md](fiches-revision-sql.md)

---

## Définitions clés

### useState
- Ajoute une variable qui "se souvient" de sa valeur entre les rendus.
- `const [valeur, setValeur] = useState(initial)`
- Appeler `setValeur(...)` redéclenche l'affichage du composant.

### useEffect
- Exécute du code *après* l'affichage (appel API, abonnement...).
- `useEffect(() => { ... }, [deps])`
- `[]` = une seule fois. `[x]` = à chaque fois que `x` change.
- Peut faire un "nettoyage" (`return () => {...}`) quand le composant disparaît.

### Props
- Données/fonctions données par un composant parent à un composant enfant.
- L'enfant ne peut pas les modifier — il appelle une fonction reçue pour prévenir le parent.

### CORS
- Sécurité du navigateur : bloque par défaut un site A qui appelle une API sur un domaine B.
- Le serveur doit autoriser explicitement le domaine autorisé.
- Dans le projet : `server/middleware/setup.js` → `cors({ origin: CLIENT_URL })`.

### API REST
- Style d'API où chaque ressource a une URL, et le verbe HTTP dit l'action :
  - `GET` = lire
  - `POST` = créer
  - `PUT` = remplacer
  - `PATCH` = modifier partiellement
  - `DELETE` = supprimer
- Exemples du projet : `GET /api/vehicles`, `POST /api/vehicles`, `PATCH /api/reservations/:id/status`.

### Trigger (PostgreSQL)
- Un bout de code SQL qui s'exécute **automatiquement** dans la base de données quand un évènement précis se produit (`INSERT`, `UPDATE`, `DELETE` sur une table) — pas besoin que le serveur Express le déclenche lui-même.
- Dans le projet : quand une réservation passe à `confirmed` (ou `cancelled`), un trigger met à jour tout seul `vehicles.status` (`available` → `reserved`/`sold`). Défini directement côté Supabase (pas un fichier du repo), le commentaire dans `reservations.js` le rappelle.
- **Pourquoi un trigger et pas juste du code dans la route Express ?** Garantit la cohérence même si quelqu'un modifie `reservations` par un autre chemin que l'API (ex: directement depuis le tableau de bord Supabase) — la règle vit dans la base, pas seulement dans une route.
- **Limite à connaître pour l'oral** : comme il n'est pas versionné dans le repo (pas de fichier `.sql`), tu ne peux pas montrer son code exact au jury — seulement expliquer son rôle et où il se trouve (Supabase → SQL Editor / Database → Triggers).

---

## Stack

React 19 (Vite) + Express 5 + Supabase (Postgres + Auth).
**Règle du projet** : lecture publique = Supabase direct (clé `anon`). Écriture/donnée sensible = passe par l'API Express (clé `service_role`, jamais exposée au navigateur).

---

## Sécurité — l'essentiel

- **Auth** : JWT Supabase en `Authorization: Bearer`. Le serveur revalide via `supabase.auth.getUser(token)`, ne fait jamais confiance à un rôle envoyé par le client.
- **Admin check** : rôle lu dans `app_metadata.role` (modifiable seulement côté serveur) — pas dans une colonne `profiles` que le client pourrait influencer.
- **Propriété** : `PATCH /reservations/:id/cancel` vérifie `reservation.client_id === req.user.id` avant d'agir, pas seulement "es-tu connecté".
- **3 failles trouvées et corrigées** :
  1. Réservation créée par insert Supabase direct → `client_id` falsifiable → remplacé par API avec `client_id` forcé serveur.
  2. Suppression client (`profiles.delete()`) laissait un compte `auth.users` orphelin → remplacé par `supabase.auth.admin.deleteUser()`.
  3. `Dashboard.jsx` annulait une réservation en écriture Supabase directe → remplacé par `PATCH /api/reservations/:id/cancel`.
- **Autres** : Helmet (en-têtes HTTP), CORS restreint à `CLIENT_URL`, rate limit 5 req/15min/IP sur `/contact`, `escapeHtml()` avant injection dans les emails (anti-XSS), rejet des `\r\n` dans l'email (anti CRLF injection).
- **Limite connue** : pas de RLS Postgres documentée — la sécurité repose sur la couche Express, pas sur la DB elle-même.

---

## Backend — l'essentiel

- Routes : `vehicles`, `reservations`, `admin`, `equipements`, `contact`, `health`, regroupées sous `/api`.
- Pattern répété : pagination `limit`/`offset`, `limit` plafonné à 100.
- Un trigger PostgreSQL met à jour `vehicles.status` automatiquement quand une réservation change de statut.
- Email de confirmation (Nodemailer/Gmail) envoyé seulement quand une réservation passe à `confirmed`.

---

## Frontend — l'essentiel

- **Filtres du catalogue dans l'URL** (`useSearchParams`) plutôt qu'en `useState` → lien partageable, retour navigateur fonctionnel.
- **Cache mémoire** des véhicules (TTL 3 min) pour éviter de re-fetch tout le catalogue à chaque navigation.
- **Charts** : Chart.js (pas Recharts — incompatible avec Vite 8).
- **Catalogue.jsx découpé** (230 lignes → 4 fichiers) : logique pure / toolbar / grille / orchestration.

---

## Tests

**93 tests** (56 serveur + 37 client), chacun explicable individuellement à l'oral.
Deux vagues de nettoyage, deux raisons différentes :
1. **33 tests supprimés** (168 → 135, hors 2e vague ci-dessous) : ils recopiaient la logique (`escapeHtml`, validations) dans le fichier de test au lieu d'importer le vrai code, ou testaient un module qui n'existait pas (`errorHandler.js`). Ces tests passaient même si le vrai code était cassé — aucune perte de couverture réelle (les tests d'intégration testent déjà ces routes via de vraies requêtes HTTP).
2. **~42 tests fusionnés/supprimés** ensuite pour la préparation à l'oral : un middleware testé en isolation (`auth.test.js`) alors que chaque route l'exerce déjà via de vraies requêtes HTTP ; un fichier (`constants.test.js`) qui ne vérifiait que des tableaux de config codés en dur, sans aucune logique ; des séries de tests quasi-identiques (ex: "accepte le statut pending/confirmed/cancelled" en 3 tests séparés, ou "affiche titre / affiche champs / affiche bouton" en 4 tests séparés pour une même page) fusionnées en un seul test avec plusieurs assertions.
- **Règle appliquée** : un test = un comportement distinct qu'on peut justifier en une phrase. Si deux tests exercent le même chemin de code avec juste une valeur différente, ils fusionnent. Si un test double une couverture déjà obtenue ailleurs (ex: unitaire vs intégration sur la même vérif 401), il est supprimé.
- **Fichiers fusionnés** : `vehicles.test.js` + `vehicles-validation.test.js` → un seul fichier ; idem pour `reservations.test.js` + `reservations-validation.test.js`.

---

## Choix techniques

| Choix | Alternative écartée | Raison |
|---|---|---|
| Chart.js | Recharts | Cassait avec Vite 8 |
| `useSearchParams` | `useState` pour les filtres | URL partageable, retour navigateur |
| `app_metadata.role` | Colonne `profiles.role` | Non modifiable par le client |
| Cache mémoire (TTL) | React Query / SWR | Besoin trop simple pour une dépendance de plus |
| Rate limit en `Map` | Redis | Suffisant pour le volume du projet |

---

## Questions probables

1. **Pourquoi pas d'écriture Supabase directe côté client ?** → Empêcher un client de falsifier `client_id` ou un rôle.
2. **Comment tu empêches un client de se faire passer pour admin ?** → Rôle en `app_metadata`, revalidé côté serveur à chaque requête.
3. **Un bug trouvé et corrigé toi-même ?** → Les 3 failles listées plus haut.
4. **Pourquoi les filtres sont dans l'URL ?** → Partage de lien, historique navigateur.
5. **Comment t'as géré le formulaire de contact contre le spam ?** → Rate limit 5/15min/IP.
6. **Et si le jury dit "93 tests c'est peu" ?** → Le nombre n'est pas l'objectif ; le compte est volontairement resserré à un test = un comportement distinct et justifiable, plutôt que de gonfler le chiffre avec des variantes qui testent la même chose deux fois.
