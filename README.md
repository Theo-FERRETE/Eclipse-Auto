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
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
```

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
# Serveur (124 tests, ~92% coverage)
cd server && npm test

# Client (64 tests)
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
- RBAC (admin / user) via `profiles.role`
- Validation des entrées sur toutes les routes sensibles
- Sanitization des emails (protection header injection)
- CORS restreint en production
- ErrorBoundary React pour les erreurs inattendues côté client

## Production

```bash
cd client && npm run build
cd ../server && NODE_ENV=production npm start
```

Le serveur Express sert les assets du build Vite depuis `client/dist/`.
