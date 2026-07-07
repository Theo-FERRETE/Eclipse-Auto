# Rapport d'Audit — Eclipse Auto v2

**Date :** 7 juillet 2026 | **Version :** 6.0

---

## Notes

| Catégorie | v4 (1er juin) | v5 (15 juin) | v6 (7 juillet) | Évolution v5→v6 |
| ----------- | --------------- | ------------ | -------------- | --------------- |
| **Sécurité** | 9/10 | 9/10 | 9/10 | = |
| **Architecture** | 7.5/10 | 8/10 | 8.5/10 | +0.5 — refactor MVC, séparation route/controller/model |
| **Performance** | 7.5/10 | 8.5/10 | 8.5/10 | = |
| **Code Quality** | 8/10 | 8/10 | 8/10 | = |
| **Tests** | 9/10 | 9/10 | 9/10 | = — chiffres corrigés : 57 tests serveur (7 suites) + 37 tests client (7 suites), 91.8% coverage serveur (mesure controllers/ et models/ incluse désormais, cf. Problèmes résolus) |
| **Documentation** | 7/10 | 7/10 | 7/10 | = |
| **DevOps** | 8.5/10 | 8.5/10 | 8.5/10 | = |
| **UX/Frontend** | 7.5/10 | 8/10 | 8/10 | = |
| **Base de Données** | 6/10 | 6/10 | 6/10 | = |
| **Gestion d'Erreurs** | 8/10 | 8/10 | 8/10 | = |

### Moyenne v4 : 7.8 / 10 → Moyenne v5 : 8.05 / 10 → Moyenne v6 : **8.1 / 10**

---

## Problèmes résolus depuis v4

### Infrastructure

**CORS silencieux en production** — résolu

- `server/middleware/setup.js` — CORS configuré avec `process.env.CLIENT_URL || 'http://localhost:5173'` comme origine autorisée, `credentials: true`
- Le flag `isProd` n'est plus utilisé pour désactiver le CORS mais uniquement pour choisir le format morgan

**Pas de logging structuré** — résolu

- `npm install morgan` ajouté à `server/package.json`
- `server/middleware/setup.js` — `morgan('dev')` en développement, `morgan('combined')` en production
- Chaque requête HTTP est maintenant loggée avec IP, méthode, route, code de réponse, durée

### Performance & SEO

**Optimisations front ajoutées depuis v4 :**

- `client/index.html` — `<link rel="canonical">` pointant sur le domaine de prod
- `client/index.html` — `<meta name="description">` pour le SEO
- `client/index.html` — `<link rel="preconnect">` pour `fonts.googleapis.com` et `fonts.gstatic.com` (réduit le RTT police)
- `client/index.html` — `<link rel="preload" fetchpriority="high">` pour `Hero.webp` (desktop) et `Hero-mobile.webp` (mobile), avec `media` queries séparées pour éviter le double chargement
- `client/public/robots.txt` — Allow `*`, pointeur vers sitemap
- `client/public/sitemap.xml` — 4 URLs avec priorités (`/` 1.0, `/catalogue` 0.9, `/contact` 0.5, `/mentions-legales` 0.3)

### Architecture

**Refactor backend route → controller → model** — ajouté

- `server/models/*.js` — un fichier par ressource (véhicules, réservations, admin, équipements), une fonction = une requête Supabase, aucune logique métier
- `server/controllers/*.js` — validation des entrées, règles métier (ex : une réservation `pending` ou `confirmed` peut être annulée), formatage des réponses, appel aux modèles
- `server/routes/*.js` — routage pur : verbe HTTP + chemin + middleware (`requireAuth`/`requireAdmin`) → fonction du contrôleur ; plus aucun `require('../supabase')` dans les routes
- `contact.js` n'a pas de modèle (aucune table associée, l'email n'est pas persisté) ; `health.js` reste une route statique, sans logique à extraire
- Refactorisation pure : comportement identique à avant, les 57 tests serveur passent sans modification de la logique métier (tests d'intégration via `supertest`, donc invisibles au découpage interne)
- `server/jest.config.js` — `collectCoverageFrom` mesure désormais `controllers/**/*.js` et `models/**/*.js` en plus de `routes/**/*.js` et `middleware/**/*.js` : le chiffre de couverture reflète maintenant tout le code qui compte (avant le refactor, la logique métier vivait dans les routes et était donc déjà couverte ; ce n'est que depuis l'extraction en controllers/models que le fichier de config avait pris du retard)

**Realtime Supabase sur le Catalogue** — ajouté

- `client/src/pages/Catalogue/Catalogue.jsx` — abonnement `postgres_changes` sur `UPDATE` de la table `vehicles`
- Mise à jour optimiste via `patchCachedVehicle()` : pas de rechargement complet, juste le véhicule modifié
- Channel proprement nettoyé dans le `return` du `useEffect` (pas de fuite mémoire)

---

## Problèmes restants

### Priorité haute

**Credentials dans git history** — non résolu, irréversible

```text
server/.env — contenu commité dans des commits anciens
Action requise : changer les clés Supabase + Gmail AVANT tout déploiement public
```

### Priorité moyenne

**Route `/api/vehicles/by-slug/:slug` inefficace**

```javascript
// vehicles.js:63 — charge TOUS les véhicules depuis Supabase puis filtre en JS
const { data: vehicles } = await supabase.from('vehicles').select('*').order(...)
const vehicle = vehicles?.find(v => { /* slugification JS */ })
// Fix : ajouter une colonne `slug` TEXT UNIQUE en base avec index,
//       populée par un trigger PostgreSQL → .eq('slug', slug).single()
```

**Rate limiting in-memory non persistant** — non résolu

```javascript
// contact.js:14 — Map en mémoire vive, réinitialisée à chaque redémarrage
const ipRequestCounts = new Map()
// Si le serveur redémarre (crash, deploy), la fenêtre de 15 min est perdue
// Fix : Redis avec TTL, ou package express-rate-limit (sans stockage externe acceptable pour ce projet)
```

### Priorité basse

- Pas de TypeScript — zéro type safety côté client et serveur
- Pas de Swagger/API docs — jury ne peut pas tester via interface
- Pas de migrations versionnées en base — schéma uniquement dans Supabase UI

---

## État des tests

### Serveur (`server/__tests__/`) — Jest + Supertest

| Suite | Tests |
| ------- | ------- |
| `integration/vehicles.test.js` | 15 |
| `integration/reservations.test.js` | 18 |
| `integration/admin.test.js` | 5 |
| `integration/equipements.test.js` | 7 |
| `integration/contact.test.js` | 4 |
| `integration/health.test.js` | 1 |
| `lib/emailTemplates.test.js` | 7 |
| **Total** | **57** |

Couverture par couche (`collectCoverageFrom` inclut désormais `controllers/` et `models/`, cf. Problèmes résolus / Architecture) :

| Couche | Statements | Branches | Functions | Lines |
| ------- | ---------- | -------- | --------- | ----- |
| `routes/` | 100% | 100% | 100% | 100% |
| `middleware/` | 94.73% | 85% | 100% | 94.11% |
| `models/` | 95.34% | 75% | 100% | 100% |
| `controllers/` | 88.09% | 80.41% | 96.55% | 97.25% |
| **Total** | **91.8%** | **80.63%** | **98.3%** | **97.79%** |

### Client (`client/__tests__/`) — Vitest + Testing Library

| Suite | Tests |
| ------- | ------- |
| `lib/utils.test.js` | 9 |
| `lib/vehiclesCache.test.js` | 6 |
| `components/Pagination.test.jsx` | 8 |
| `components/ErrorBoundary.test.jsx` | 3 |
| `pages/Login.test.jsx` | 4 |
| `pages/Register.test.jsx` | 4 |
| `pages/Contact.test.jsx` | 3 |
| **Total** | **37** |

---

## Inventaire complet du projet

### Serveur (`server/`)

| Fichier | Rôle |
| --------- | ------ |
| `app.js` | Express + Helmet + middleware + routes + handler d'erreur global |
| `index.js` | Point d'entrée, écoute sur PORT |
| `constants.js` | `VEHICLE_STATUSES`, `RESERVATION_STATUSES`, `FUEL_TYPES`, `TRANSMISSIONS` |
| `supabase.js` | Client Supabase (service role) |
| `middleware/auth.js` | `requireAuth` + `requireAdmin` via Supabase JWT |
| `middleware/setup.js` | CORS, morgan, express.json |
| `routes/api.js` | Routeur central (`/vehicles`, `/reservations`, `/admin`, `/contact`, `/equipements`, `/health`) |
| `routes/vehicles.js` | Routage CRUD véhicules (thin) → `vehicleController` |
| `routes/reservations.js` | Routage réservations (thin) → `reservationController` |
| `routes/admin.js` | Routage stats/clients (thin) → `adminController` |
| `routes/equipements.js` | Routage CRUD équipements (thin) → `equipementController` |
| `routes/contact.js` | Routage formulaire contact (thin) → `contactController` |
| `routes/health.js` | GET `/api/health` |
| `controllers/vehicleController.js` | Validation, logique CRUD véhicules, appelle `vehicleModel` |
| `controllers/reservationController.js` | Règles de réservation (statuts annulables, liaison équipements), envoi email de confirmation Nodemailer, appelle `reservationModel` |
| `controllers/adminController.js` | Agrégation des stats dashboard, liste/suppression clients, appelle `adminModel` |
| `controllers/equipementController.js` | Validation, logique CRUD équipements, appelle `equipementModel` |
| `controllers/contactController.js` | Rate limiting in-memory, validation email, XSS escape, envoi email (pas de modèle — aucune table associée) |
| `models/vehicleModel.js` | Accès Supabase table `vehicles` |
| `models/reservationModel.js` | Accès Supabase table `reservations` (jointures véhicule/équipements, lookup auth pour l'email de confirmation) |
| `models/adminModel.js` | Comptages Supabase agrégés (véhicules, réservations, clients) |
| `models/equipementModel.js` | Accès Supabase table `equipements` |
| `lib/emailTemplates.js` | Template HTML email de confirmation |

### Client (`client/src/`)

| Couche | Fichiers clés |
| -------- | -------------- |
| **Auth** | `lib/AuthContext.jsx` (context + `useAuth`), `lib/auth.js`, `lib/supabase.js` |
| **Cache** | `lib/vehiclesCache.js` — cache mémoire 3 min, `patchCachedVehicle`, `invalidateVehiclesCache` |
| **Routing** | `App.jsx` — 13 routes lazy-loaded, `ProtectedRoute` avec `requireAdmin` |
| **Pages publiques** | `Home`, `Catalogue`, `VehicleDetail`, `Contact`, `MentionsLegales`, `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `NotFound` |
| **Pages client** | `Dashboard` (profil + réservations), `Reservation` |
| **Pages admin** | `AdminDashboard` (stats + charts), `AdminVehicles` (CRUD), `AdminReservations` (statuts), `AdminUsers` |
| **Composants** | `Navbar`, `Footer`, `Filters`, `Pagination`, `VehicleCard`, `ErrorBoundary`, `ConfirmModal`, `AdminCharts` (Recharts), `AdminVehicleModal`, `ReservationForm` |
| **Filtres URL** | `pages/Catalogue/catalogueFilters.js` — `filtersFromParams`, `buildParams` |

---

## Résumé jury

### Points forts à mettre en avant

- 94 tests automatisés (57 serveur Jest + 37 client Vitest), 91.8% coverage serveur (routes + controllers + models + middleware)
- CI/CD complet sur GitHub Actions — tests + lint + build à chaque push
- Architecture backend en couches route → controller → model : routes = routage pur, controllers = logique métier/validation, models = accès Supabase (une fonction = une requête)
- Relation many-to-many réservations ↔ équipements (`reservation_equipements`) exposée via `/api/equipements`, démonstration du CP6
- Sécurité : Helmet, rate limiting, XSS escaping, validation email + injection header, RBAC (requireAuth / requireAdmin)
- Morgan logging en production (`combined`) : chaque requête tracée
- CORS configuré via variable d'environnement, pas hard-codé
- Realtime Supabase : le catalogue se met à jour sans rechargement quand un admin change le statut d'un véhicule
- Performance front : preload LCP Hero image (desktop + mobile), preconnect fonts, sitemap + robots.txt
- Architecture propre côté client : cache 3 min avec patch optimiste, filtres entièrement dans l'URL (partageable, rechargeable)

### Questions probables du jury

- *"Qu'est-ce que tu testerais en priorité si tu avais plus de temps ?"* → Cypress pour les tests end-to-end (flux réservation complet), TypeScript pour la safety, colonne `slug` indexée en DB
- *"Comment tu gères les credentials en prod ?"* → Variables d'environnement sur le serveur, jamais en git, rotation obligatoire avant déploiement public
- *"Pourquoi Express et pas Fastify ou NestJS ?"* → Simplicité et rapidité de développement pour un projet de cette taille ; Fastify serait un bon choix suivant pour les perfs brutes
- *"Comment tu scalerais à 10 000 users ?"* → Redis pour le cache et le rate limiting, load balancer (sticky sessions pour les WebSockets Realtime), pool de connexions Supabase, CDN pour les assets
- *"Pourquoi Supabase Realtime sur le catalogue ?"* → Évite le polling ; si un admin change un véhicule en `reserved`, les visiteurs voient le badge mis à jour en temps réel sans refresh
- *"Comment fonctionne ton cache côté client ?"* → `vehiclesCache.js` garde les données 3 min en mémoire. Si le cache est froid et qu'on arrive sur une fiche véhicule directement, on appelle `/api/vehicles/by-slug/:slug` sans charger tout le catalogue. `patchCachedVehicle` permet à la mise à jour Realtime d'être cohérente avec le cache local.

---

Audit v6 — 7 juillet 2026
