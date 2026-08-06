← [Documentation](../README.md)

# Front — l'application React

Dossier : `client/`. Environ 3 900 lignes.
React 19 · Vite 8 · React Router 7 · Chart.js · Vitest. En **modules ES** (`import`/`export`).

## Sommaire

| Page | Contenu |
|---|---|
| [architecture.md](architecture.md) | Conventions et structure des dossiers, le routing et les 18 routes, le code splitting, le build, les variables d'environnement |
| [donnees.md](donnees.md) | La règle « API Express vs Supabase direct », le motif d'appel, le cache véhicules, le Realtime, les filtres dans l'URL, les doublons connus |
| [auth.md](auth.md) | `auth.js` et `AuthContext`, `ProtectedRoute`, le parcours complet d'une connexion |

Le rôle détaillé de chaque fichier est listé dans `../documentation.html`.

## Arborescence commentée

```text
client/
├── index.html          Page HTML unique : une <div id="root"> et rien d'autre (SPA)
├── vite.config.js      Alias @, proxy /api en dev, découpage des chunks, config Vitest
├── jsconfig.json       Fait comprendre l'alias @ à VS Code (autocomplétion, ctrl+clic)
│
├── public/             Servi tel quel, sans traitement
│   ├── img/            Les photos de véhicules en .webp
│   ├── favicon.svg, logo-eclipse.svg, icons.svg
│   └── robots.txt, sitemap.xml   (SEO)
│
└── src/
    ├── main.jsx        Point d'entrée : monte <AuthProvider><App /> dans #root
    ├── App.jsx         TOUTES les routes du site — le plan du site
    ├── index.css       Styles globaux : variables CSS, reset, classes utilitaires
    │
    ├── lib/            Code partagé, sans JSX
    │   ├── supabase.js      Le client Supabase (clé anon)
    │   ├── auth.js          login / register / logout / getSession / getProfile
    │   ├── AuthContext.jsx  Le contexte React qui porte la session
    │   ├── vehiclesCache.js Cache mémoire du catalogue (3 min)
    │   ├── utils.js         toSlug, formatPrice, optimizeImageUrl, libellés de statuts
    │   └── constants.js     Listes de valeurs
    │
    ├── pages/          Un dossier par écran
    │   ├── Home, Catalogue, VehicleDetail, Reservation, Contact
    │   ├── Login, Register, ForgotPassword, ResetPassword
    │   ├── Dashboard, MentionsLegales, NotFound
    │   └── admin/      AdminDashboard, AdminVehicles, AdminReservations,
    │                   AdminUsers, AdminEquipements
    │
    └── components/     Un dossier par composant réutilisable
        ├── Navbar, Footer, Pagination, Filters, VehicleCard, ConfirmModal
        ├── ErrorBoundary, ProtectedRoute
        ├── Dashboard*     (Sidebar, Reservations, Profile)
        ├── Reservation*   (Breadcrumb, VehiclePanel, Form, Success)
        └── Admin*         (Sidebar, PageHeader, VehicleCard, VehicleModal, Charts)
```
