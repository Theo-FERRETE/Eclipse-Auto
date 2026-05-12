# Eclipse Auto v2

Une plateforme de gestion et réservation de véhicules avec interface d'administration.

## Stack Technique

**Backend:** Node.js + Express 5.2.1
**Frontend:** React 19 + Vite
**Database:** Supabase (PostgreSQL)
**Auth:** Supabase Auth + JWT

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

## Architecture

### Backend Routes

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/api/vehicles` | GET | Public | Liste des véhicules |
| `/api/vehicles/:id` | GET | Public | Détails d'un véhicule |
| `/api/vehicles` | POST | Admin | Créer un véhicule |
| `/api/vehicles/:id` | PUT | Admin | Modifier un véhicule |
| `/api/vehicles/:id` | DELETE | Admin | Supprimer un véhicule |
| `/api/reservations` | GET | Auth | Mes réservations |
| `/api/reservations/all` | GET | Admin | Toutes les réservations |
| `/api/reservations` | POST | Auth | Créer une réservation |
| `/api/reservations/:id/status` | PATCH | Admin | Changer statut |
| `/api/admin/stats` | GET | Admin | Statistiques |
| `/api/admin/clients` | GET | Admin | Liste des clients |
| `/api/contact` | POST | Public | Formulaire contact |

### Frontend Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Accueil |
| `/catalogue` | Public | Catalogue des véhicules |
| `/vehicles/:slug` | Public | Détails véhicule |
| `/login` | Public | Connexion |
| `/register` | Public | Inscription |
| `/contact` | Public | Formulaire contact |
| `/dashboard` | Private | Espace client |
| `/reserve/:slug` | Private | Réserver un véhicule |
| `/admin/*` | Admin | Panneau administration |

## Variables d'Environnement

### Server (.env)
- `PORT` - Port du serveur (default: 3001)
- `NODE_ENV` - Environnement (development/production)
- `SUPABASE_URL` - URL Supabase
- `SUPABASE_SERVICE_KEY` - Clé de service Supabase
- `GMAIL_USER` - Email Gmail
- `GMAIL_PASSWORD` - Mot de passe Gmail

### Client (.env)
- `VITE_SUPABASE_URL` - URL Supabase
- `VITE_SUPABASE_ANON_KEY` - Clé anon Supabase

## Développement

```bash
# Backend (from server/)
npm run dev

# Frontend (from client/)
npm run dev

# Build frontend
npm run build
```

## Production

```bash
# Compiler le frontend
cd client
npm run build

# Démarrer le serveur
cd ../server
NODE_ENV=production npm start
```

Le serveur servira les assets frontend depuis `client/dist/`.

## Base de Données

### Tables Principales
- `profiles` - Profils utilisateurs (role, email)
- `vehicles` - Catalogue véhicules
- `reservations` - Réservations (statut, dates)

## Sécurité

- Auth via JWT Supabase
- RBAC (admin/user) via table `profiles.role`
- CORS activé en développement uniquement
- Validation des entrées sur API sensibles
- Sanitization des emails (contact form)

## Dépannage

**App crash au démarrage?**
- Vérifier que AuthContext.jsx existe (`client/src/lib/AuthContext.jsx`)
- Vérifier les variables .env

**Erreurs CORS?**
- En développement: CORS est auto-configuré
- En production: CONFIG_URL doit matcher domaine frontend

**Routes 404?**
- Vérifier que `client/dist/` existe (npm run build en client/)
