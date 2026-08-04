# Eclipse Auto

Plateforme de gestion et réservation de véhicules haut de gamme, avec interface d'administration complète.

## Documentation

La doc technique est dans [`docs/`](docs/README.md), séparée en deux :

- **[docs/back/](docs/back/README.md)** — [architecture en 4 couches](docs/back/architecture/README.md) ·
  [ce que fait Supabase](docs/back/supabase/README.md) ·
  [authentification et sécurité](docs/back/securite/README.md) ·
  [emails](docs/back/emails/README.md)
- **[docs/front/](docs/front/README.md)** — [structure et routing](docs/front/architecture/README.md) ·
  [d'où viennent les données](docs/front/donnees/README.md) ·
  [authentification côté client](docs/front/auth/README.md)
- **[docs/JWT.md](docs/JWT.md)** — où est physiquement stocké le jeton, ce qu'il contient,
  par où il passe, et ce qu'un attaquant peut ou non en faire

Référence complète de l'API : [docs/ENDPOINTS.md](docs/ENDPOINTS.md).

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js + Express 5 |
| Frontend | React 19 + Vite 8 |
| Base de données | Supabase (PostgreSQL) |
| Authentification | Supabase Auth + JWT |
| Email | Nodemailer + Gmail SMTP |
| Tests serveur | Jest + Supertest |
| Tests client | Vitest + Testing Library |
| CI/CD | GitHub Actions |

## Installation

### Backend

```bash
cd server
npm install
cp .env.example .env
# Remplir les variables d'environnement
npm start
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Variables d'environnement

### Server (`server/.env`)

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
TRUST_PROXY=0
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
```

`TRUST_PROXY` ne doit valoir `1` que si l'application tourne derrière un proxy inverse
qui réécrit `X-Forwarded-For`. Sinon un client pourrait forger cet en-tête et contourner
le rate limiting du formulaire de contact.

### Client (`client/.env`)

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## API

### Véhicules

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/api/vehicles` | GET | Public | Liste paginée des véhicules |
| `/api/vehicles/by-slug/:slug` | GET | Public | Détail par slug (brand-model) |
| `/api/vehicles/:id` | GET | Public | Détail par UUID |
| `/api/vehicles` | POST | Admin | Créer un véhicule |
| `/api/vehicles/:id` | PUT | Admin | Modifier un véhicule |
| `/api/vehicles/:id` | DELETE | Admin | Supprimer un véhicule |

### Réservations

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/api/reservations` | GET | Auth | Mes réservations |
| `/api/reservations/all` | GET | Admin | Toutes les réservations |
| `/api/reservations` | POST | Auth | Créer une réservation |
| `/api/reservations/:id/status` | PATCH | Admin | Changer le statut |
| `/api/reservations/:id/cancel` | PATCH | Auth | Annuler (client) |

### Équipements

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/api/equipements` | GET | Public | Catalogue des équipements en option |
| `/api/equipements` | POST | Admin | Créer un équipement |
| `/api/equipements/:id` | PUT | Admin | Modifier un équipement |
| `/api/equipements/:id` | DELETE | Admin | Supprimer un équipement |

### Administration & autres

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/api/admin/stats` | GET | Admin | Statistiques du tableau de bord |
| `/api/admin/clients` | GET | Admin | Liste des clients |
| `/api/contact` | POST | Public | Formulaire de contact |
| `/api/health` | GET | Public | Statut du serveur |

## Pages frontend

| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Accueil |
| `/catalogue` | Public | Catalogue des véhicules |
| `/vehicles/:slug` | Public | Détails d'un véhicule |
| `/login` | Public | Connexion |
| `/register` | Public | Inscription |
| `/contact` | Public | Formulaire de contact |
| `/dashboard` | Privé | Espace client |
| `/reserve/:slug` | Privé | Réserver un véhicule |
| `/admin/*` | Admin | Panneau d'administration |

## Rôle de chaque fichier

Chaque fichier source porte aussi un commentaire d'en-tête qui reprend et détaille son rôle.

### Serveur — `server/`

| Fichier | Rôle |
|---|---|
| `index.js` | Point d'entrée : vérifie les variables d'environnement obligatoires puis démarre l'écoute. Refuse de démarrer s'il en manque une |
| `app.js` | Assemble l'application : Helmet + CSP, middlewares, routes `/api`, service du build React, gestionnaire d'erreurs. Exporté sans `listen()` pour les tests |
| `supabase.js` | Client Supabase du serveur, clé `service_role` (contourne la RLS, jamais exposée au navigateur) |
| `constants.js` | Valeurs autorisées (statuts véhicule et réservation, carburants, transmissions) |
| `middleware/setup.js` | Middlewares communs : compression, CORS, logs morgan, parsing JSON |
| `middleware/auth.js` | `requireAuth` (401 sinon) et `requireAdmin` (403 sinon). Vérifie le JWT, lit le rôle dans `app_metadata` |
| `routes/api.js` | Hub : monte les six routeurs sous `/api` |
| `routes/vehicles.js` | Routes véhicules — lecture publique, écritures admin |
| `routes/reservations.js` | Routes réservations — tout protégé, `/all` et `/:id/status` en admin |
| `routes/admin.js` | Statistiques et gestion des clients, tout en admin |
| `routes/equipements.js` | Catalogue d'options — lecture publique, écritures admin |
| `routes/contact.js` | Formulaire de contact — publique mais rate-limitée |
| `routes/health.js` | Route de supervision, répond 200 si l'API est debout |
| `controllers/vehicleController.js` | Validation des véhicules et construction du payload partiel (`VEHICLE_FIELDS`) |
| `controllers/reservationController.js` | Le plus dense : `client_id` forcé depuis le JWT, contrôle du propriétaire à l'annulation, véhicule déjà pris → 409, déclenchement de l'email |
| `controllers/adminController.js` | Agrégation des statistiques et gestion des comptes clients |
| `controllers/equipementController.js` | CRUD du catalogue d'équipements |
| `controllers/contactController.js` | Validation, rate limiting par IP, envoi Nodemailer |
| `models/vehicleModel.js` | Requêtes Supabase des véhicules |
| `models/reservationModel.js` | Requêtes des réservations, dont l'embed many-to-many des équipements |
| `models/adminModel.js` | Les huit compteurs du dashboard + gestion des clients |
| `models/equipementModel.js` | Requêtes du catalogue d'équipements |
| `lib/emailTemplates.js` | `escapeHtml()` et le gabarit HTML de l'email de confirmation |

### Client — `client/`

| Fichier | Rôle |
|---|---|
| `vite.config.js` | Alias `@`, proxy `/api` en dev, découpage des chunks, config Vitest |
| `jsconfig.json` | Fait comprendre l'alias `@` à l'éditeur (autocomplétion, ctrl+clic) |
| `src/main.jsx` | Monte l'app dans `#root`, avec `AuthProvider` au-dessus |
| `src/App.jsx` | Plan du site : toutes les routes et les trois niveaux d'accès |
| `src/index.css` | Styles globaux : variables CSS, reset, classes utilitaires |

**`src/lib/` — code partagé**

| Fichier | Rôle |
|---|---|
| `supabase.js` | Client Supabase du navigateur, clé `anon` (publique par conception) |
| `auth.js` | login / register / logout / getSession / getProfile |
| `AuthContext.jsx` | Résout la session une fois et la diffuse via `useAuth()` |
| `vehiclesCache.js` | Cache mémoire du catalogue (3 min), partagé entre les pages |
| `utils.js` | `toSlug`, `formatPrice`, `optimizeImageUrl`, libellés des statuts |
| `constants.js` | Listes de valeurs (doublon partiel avec `utils.js`) |

**`src/pages/` — un dossier par écran**

| Fichier | Rôle |
|---|---|
| `Home/Home.jsx` | Accueil : hero, chiffres clés, 3 véhicules mis en avant |
| `Catalogue/Catalogue.jsx` | État, filtrage, tri, pagination, abonnement Realtime |
| `Catalogue/catalogueFilters.js` | Traduction URL ↔ filtres (fonctions pures) |
| `Catalogue/CatalogueToolbar.jsx` | Recherche et menu de tri |
| `Catalogue/CatalogueGrid.jsx` | Grille de résultats et ses quatre états d'affichage |
| `VehicleDetail/VehicleDetail.jsx` | Fiche véhicule par slug + choix des équipements |
| `Reservation/Reservation.jsx` | Formulaire de demande, `POST /api/reservations` |
| `Contact/Contact.jsx` | Formulaire de contact |
| `Login/Login.jsx` | Connexion |
| `Register/Register.jsx` | Inscription |
| `ForgotPassword/ForgotPassword.jsx` | Demande de réinitialisation du mot de passe |
| `ResetPassword/ResetPassword.jsx` | Saisie du nouveau mot de passe (événement `PASSWORD_RECOVERY`) |
| `Dashboard/Dashboard.jsx` | Espace client : réservations et profil |
| `MentionsLegales/MentionsLegales.jsx` | Mentions légales (page statique) |
| `NotFound/NotFound.jsx` | Page 404 |
| `admin/AdminDashboard/` | 4 KPIs + 2 graphiques, depuis `/api/admin/stats` |
| `admin/AdminVehicles/` | CRUD véhicules |
| `admin/AdminReservations/` | Filtre et changement de statut des réservations |
| `admin/AdminUsers/` | Gestion des comptes clients |
| `admin/AdminEquipements/` | CRUD du catalogue d'équipements |

**`src/components/` — un dossier par composant**

| Fichier | Rôle |
|---|---|
| `Navbar/` | Navigation principale, lien Admin conditionné à `isAdmin` |
| `Footer/` | Pied de page global |
| `ProtectedRoute/` | Garde-barrière des routes privées (confort d'interface, pas sécurité) |
| `ErrorBoundary/` | Capture les erreurs de rendu et affiche un écran de repli |
| `Pagination/` | Pagination réutilisable avec troncature en « … » |
| `Filters/` | Panneau de filtres du catalogue |
| `VehicleCard/` | Carte véhicule du catalogue |
| `ConfirmModal/` | Confirmation avant action destructive |
| `AdminSidebar/` · `AdminPageHeader/` | Navigation et en-tête des pages d'administration |
| `AdminVehicleCard/` · `AdminVehicleModal/` | Ligne véhicule et formulaire du back-office |
| `AdminCharts/VehicleStatusChart.jsx` | Anneau Chart.js — véhicules par statut |
| `AdminCharts/ReservationStatusChart.jsx` | Barres Chart.js — réservations par statut |
| `DashboardSidebar/` | Colonne gauche de l'espace client |
| `DashboardReservations/` | Liste des réservations du client + annulation |
| `DashboardProfile/` | Modification du profil et du mot de passe |
| `ReservationBreadcrumb/` | Fil d'Ariane de la réservation |
| `ReservationVehiclePanel/` | Rappel du véhicule choisi |
| `ReservationForm/` | Formulaire de demande (message, date, équipements) |
| `ReservationSuccess/` | Écran de confirmation après envoi |

## Tests

```bash
# Serveur (65 tests, 8 suites, 92.7% coverage — routes + controllers + models + middleware)
# Seuils de couverture verrouillés dans jest.config.js : la CI échoue en cas de régression
cd server && npm test

# Client (37 tests, 7 suites)
cd client && npm test
```

## Base de données

### Tables principales

- `profiles` — profils utilisateurs (rôle, prénom, nom, téléphone)
- `vehicles` — catalogue véhicules (marque, modèle, prix, statut…)
- `reservations` — réservations (statut, date RDV, message)

Un trigger PostgreSQL met à jour automatiquement `vehicles.status` lors d'un changement de statut de réservation.

## Sécurité

- Authentification JWT via Supabase Auth
- RBAC : autorisation serveur sur `app_metadata.role` (non modifiable par le client) ;
  `profiles.role` ne sert qu'à l'affichage côté React
- Toutes les lectures et écritures sensibles passent par l'API Express : la clé anon
  publique ne donne accès qu'aux véhicules, qui sont des données publiques
- Validation des entrées sur toutes les routes sensibles
- Sanitization des emails (protection header injection)
- CSP explicite (Helmet) autorisant uniquement l'origine Supabase en plus de `self`
- CORS restreint en production
- Rate limiting du formulaire de contact, non contournable via `X-Forwarded-For`
  hors configuration proxy explicite (`TRUST_PROXY`)
- ErrorBoundary React pour les erreurs inattendues côté client

## Production

```bash
cd client && npm run build
cd ../server && NODE_ENV=production npm start
```

Le serveur Express sert les assets du build Vite depuis `client/dist/`.
