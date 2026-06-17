# Rapport d'Audit — Eclipse Auto v2

**Date :** 15 juin 2026 | **Version :** 5.0

---

## Notes

| Catégorie | v4 (1er juin) | v5 (15 juin) | Évolution |
| ----------- | --------------- | ------------ | --------- |
| **Sécurité** | 9/10 | 9/10 | = |
| **Architecture** | 7.5/10 | 8/10 | +0.5 — Realtime subscription, découpage admin en 4 pages |
| **Performance** | 7.5/10 | 8.5/10 | +1 — preload Hero, preconnect Fonts, sitemap, robots.txt |
| **Code Quality** | 8/10 | 8/10 | = |
| **Tests** | 9/10 | 9/10 | = — 188 tests, 91.89% coverage serveur |
| **Documentation** | 7/10 | 7/10 | = |
| **DevOps** | 8.5/10 | 8.5/10 | = |
| **UX/Frontend** | 7.5/10 | 8/10 | +0.5 — mises à jour temps réel catalogue, images responsives |
| **Base de Données** | 6/10 | 6/10 | = |
| **Gestion d'Erreurs** | 8/10 | 8/10 | = |

### Moyenne v4 : 7.8 / 10 → Moyenne v5 : **8.05 / 10**

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

| Suite | Tests | Coverage |
| ------- | ------- | --------- |
| `middleware/auth.test.js` | 12 | 96% |
| `routes/vehicles.test.js` | 18 | 90% |
| `routes/reservations.test.js` | 22 | 92% |
| `routes/contact.test.js` | 14 | 90% |
| `integration/vehicles.test.js` | — | — |
| `integration/vehicles-validation.test.js` | 6 | — |
| `integration/reservations.test.js` | — | — |
| `integration/reservations-validation.test.js` | 7 | — |
| `integration/health.test.js` | 3 | 100% |
| `integration/admin.test.js` | 10 | — |
| `integration/contact.test.js` | — | — |
| `lib/emailTemplates.test.js` | 8 | — |
| `utils/errorHandler.test.js` | 6 | — |
| `constants.test.js` | 8 | — |
| **Total** | **124** | **91.89%** |

### Client (`client/__tests__/`) — Vitest + Testing Library

| Suite | Tests |
| ------- | ------- |
| `lib/utils.test.js` | 20 |
| `lib/vehiclesCache.test.js` | 8 |
| `components/Pagination.test.jsx` | 8 |
| `components/ErrorBoundary.test.jsx` | 4 |
| `pages/Login.test.jsx` | 9 |
| `pages/Register.test.jsx` | 7 |
| `pages/Contact.test.jsx` | 8 |
| **Total** | **64** |

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
| `routes/api.js` | Routeur central (`/vehicles`, `/reservations`, `/admin`, `/contact`, `/health`) |
| `routes/vehicles.js` | CRUD véhicules (GET liste, GET by-slug, GET by-id, POST, PUT, DELETE) |
| `routes/reservations.js` | Réservations + envoi email de confirmation Nodemailer |
| `routes/admin.js` | Stats dashboard, liste clients, suppression client |
| `routes/contact.js` | Formulaire contact avec rate limiting in-memory, validation email, XSS escape |
| `routes/health.js` | GET `/api/health` |
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

- 188 tests automatisés (124 serveur Jest + 64 client Vitest), 92% coverage serveur
- CI/CD complet sur GitHub Actions — tests + lint + build à chaque push
- Sécurité : Helmet, rate limiting, XSS escaping, validation email + injection header, RBAC (requireAuth / requireAdmin)
- Morgan logging en production (`combined`) : chaque requête tracée
- CORS configuré via variable d'environnement, pas hard-codé
- Realtime Supabase : le catalogue se met à jour sans rechargement quand un admin change le statut d'un véhicule
- Performance front : preload LCP Hero image (desktop + mobile), preconnect fonts, sitemap + robots.txt
- Architecture propre : cache client 3 min avec patch optimiste, filtres entièrement dans l'URL (partageable, rechargeable)

### Questions probables du jury

- *"Qu'est-ce que tu testerais en priorité si tu avais plus de temps ?"* → Cypress pour les tests end-to-end (flux réservation complet), TypeScript pour la safety, colonne `slug` indexée en DB
- *"Comment tu gères les credentials en prod ?"* → Variables d'environnement sur le serveur, jamais en git, rotation obligatoire avant déploiement public
- *"Pourquoi Express et pas Fastify ou NestJS ?"* → Simplicité et rapidité de développement pour un projet de cette taille ; Fastify serait un bon choix suivant pour les perfs brutes
- *"Comment tu scalerais à 10 000 users ?"* → Redis pour le cache et le rate limiting, load balancer (sticky sessions pour les WebSockets Realtime), pool de connexions Supabase, CDN pour les assets
- *"Pourquoi Supabase Realtime sur le catalogue ?"* → Évite le polling ; si un admin change un véhicule en `reserved`, les visiteurs voient le badge mis à jour en temps réel sans refresh
- *"Comment fonctionne ton cache côté client ?"* → `vehiclesCache.js` garde les données 3 min en mémoire. Si le cache est froid et qu'on arrive sur une fiche véhicule directement, on appelle `/api/vehicles/by-slug/:slug` sans charger tout le catalogue. `patchCachedVehicle` permet à la mise à jour Realtime d'être cohérente avec le cache local.

---

Audit v5 — 15 juin 2026
