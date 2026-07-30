# Eclipse Auto

Plateforme de gestion et réservation de véhicules haut de gamme, avec interface d'administration complète.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js + Express 5 |
| Frontend | React 19 + Vite 6 |
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
