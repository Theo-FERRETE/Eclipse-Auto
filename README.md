# Eclipse Auto

Plateforme de gestion et réservation de véhicules haut de gamme, avec interface d'administration complète.

## Documentation

La doc technique est dans [`docs/`](docs/README.md), séparée en deux :

- **[docs/back/](docs/back/README.md)** : l'API Express. Les 4 couches, démarrage et
  configuration, ce que fait Supabase (requêtes, schéma, clés et RLS, Auth),
  authentification et sécurité, validation, en-têtes HTTP, emails
- **[docs/front/](docs/front/README.md)** : l'application React. Conventions et structure,
  routing, performance et build, d'où viennent les données, cache, Realtime,
  authentification côté client
- **[docs/back/JWT.md](docs/back/JWT.md)** : où est physiquement stocké le jeton, ce qu'il contient,
  par où il passe, et ce qu'un attaquant peut ou non en faire

Référence complète de l'API : [docs/ENDPOINTS.md](docs/ENDPOINTS.md).
Rôle détaillé de chaque fichier source : `docs/documentation.html`.

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

## Routes

Les six familles de routes de l'API et leur niveau de protection sont résumées dans
[docs/back/](docs/back/architecture.md#les-6-familles-de-routes). Le détail complet de chaque
endpoint, query params, body attendu, réponses, codes d'erreur, est dans
[docs/ENDPOINTS.md](docs/ENDPOINTS.md).

Les 18 routes du front et leurs trois niveaux d'accès sont dans
[docs/front/](docs/front/architecture.md#le-routing--srcappjsx).

## Rôle de chaque fichier

Chaque fichier source porte un commentaire d'en-tête qui détaille son rôle. Le tableau
complet fichier par fichier, serveur, pages, composants, `lib/` : est dans
`docs/documentation.html` (sections « Fichiers du serveur », « Composants », « Utilitaires »).

L'arborescence commentée de chaque côté est en tête de [docs/back/](docs/back/README.md#arborescence-commentée)
et de [docs/front/](docs/front/README.md#arborescence-commentée).

## Tests

```bash
# Serveur (65 tests, 8 suites, 92.7% coverage - routes + controllers + models + middleware)
# Seuils de couverture verrouillés dans jest.config.js : la CI échoue en cas de régression
cd server && npm test

# Client (37 tests, 7 suites)
cd client && npm test
```

## Base de données

### Tables principales

- `profiles` : profils utilisateurs (rôle, prénom, nom, téléphone)
- `vehicles` : catalogue véhicules (marque, modèle, prix, statut...)
- `reservations` : réservations (statut, date RDV, message)

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
