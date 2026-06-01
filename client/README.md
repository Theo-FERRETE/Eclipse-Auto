# Eclipse Auto — Client

Interface utilisateur de l'application Eclipse Auto, construite avec React 19 et Vite.

## Stack

- **React 19** + **Vite 6**
- **React Router v7** — navigation SPA
- **Recharts** — graphiques du dashboard admin
- **ESLint** avec `eslint-plugin-react-hooks` v7

## Scripts

```bash
npm run dev      # Serveur de développement (port 5173)
npm run build    # Build de production
npm run preview  # Prévisualiser le build
npm run lint     # ESLint
npm test         # Tests unitaires (vitest run)
npm run test:watch  # Tests en mode watch
```

## Structure

```text
src/
  components/    # Composants réutilisables (Navbar, Footer, Pagination, ErrorBoundary…)
  pages/         # Pages de l'application (Home, Catalogue, VehicleDetail, Login…)
  lib/           # Utilitaires (auth, supabase, vehiclesCache, utils, constants)
  context/       # AuthContext
  assets/        # Ressources statiques
__tests__/
  components/    # Tests des composants
  pages/         # Tests des pages
  lib/           # Tests des utilitaires
  setup.js       # Configuration jest-dom
```

## Tests

64 tests unitaires couvrant les composants, pages et utilitaires.

```bash
npm test
```

## Variables d'environnement

Créer un fichier `.env` à la racine du dossier `client/` :

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
