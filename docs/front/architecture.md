← [Front](README.md)

# Architecture et conventions

## Conventions du projet

**Un dossier par composant, le CSS à côté.**
`components/Navbar/Navbar.jsx` + `components/Navbar/Navbar.css`.
Le CSS est importé dans le `.jsx` (`import './Navbar.css'`). Certains petits composants
n'ont pas de CSS propre et s'appuient sur `index.css`.

**Alias `@` = `client/src/`.**
`import Navbar from '@/components/Navbar/Navbar'` : pas de `../../../`. Défini deux fois :
dans `vite.config.js` (pour le build **et** pour Vitest) et dans `jsconfig.json` (pour l'IDE).

**Un export par défaut par fichier**, nommé comme le fichier.

**`page` vs `component`** : si c'est une URL du site, ça va dans `pages/`. Sinon dans
`components/`.

## Les trois dossiers de `src/`

| Dossier | Rôle |
|---|---|
| `lib/` | Code partagé sans JSX : client Supabase, auth, cache, helpers, constantes |
| `pages/` | Un dossier par écran du site. Les 5 écrans d'administration sont regroupés dans `pages/admin/` |
| `components/` | Tout ce qui est réutilisé ou extrait d'une page pour l'alléger |

Les composants suivent un préfixe par famille, ce qui les regroupe visuellement dans
l'explorateur de fichiers :

- `Dashboard*` : Sidebar, Reservations, Profile
- `Reservation*` : Breadcrumb, VehiclePanel, Form, Success
- `Admin*` : Sidebar, PageHeader, VehicleCard, VehicleModal, Charts

## Commandes

```bash
cd client
npm run dev       # serveur Vite sur http://localhost:5173
npm run build     # build de production dans client/dist
npm run preview   # prévisualise le build
npm test          # vitest run  (37 tests)
npm run lint      # eslint
```

---

## Le routing : `src/App.jsx`

C'est le plan du site : 18 routes, toutes visibles d'un coup d'œil.

### Trois niveaux d'accès

```jsx
// Public
<Route path="/catalogue" element={<Catalogue />} />

// Connecté
<Route path="/dashboard" element={
  <ProtectedRoute><Dashboard /></ProtectedRoute>
} />

// Admin
<Route path="/admin" element={
  <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
} />
```

| Chemin | Accès | Page |
|---|---|---|
| `/` | public | Home |
| `/catalogue` | public | Catalogue |
| `/vehicles/:slug` | public | VehicleDetail |
| `/login`, `/register` | public | Login, Register |
| `/forgot-password`, `/reset-password` | public | mot de passe oublié |
| `/contact`, `/mentions-legales` | public | Contact, MentionsLegales |
| `/reserve/:slug` | connecté | Reservation |
| `/dashboard` | connecté | Dashboard client |
| `/admin` | admin | AdminDashboard |
| `/admin/vehicles` | admin | CRUD véhicules |
| `/admin/reservations` | admin | gestion des réservations |
| `/admin/users` | admin | gestion des clients |
| `/admin/equipements` | admin | CRUD équipements |
| `*` | public | NotFound (404) |

### Le `:slug` plutôt qu'un `:id`

Les URLs de véhicules sont `/vehicles/bmw-m5-competition` et non
`/vehicles/8f3c1a2e-...`. Le slug est calculé depuis `brand` + `model` par `toSlug()`
(`lib/utils.js`) : minuscules, accents retirés, espaces en tirets.

C'est un choix **SEO et lisibilité** : une URL parlante est mieux référencée et se partage
mieux qu'un UUID.

**Limite connue** : il n'y a pas de colonne `slug` en base. Le serveur recalcule donc
le slug de **tous** les véhicules pour retrouver le bon
(`vehicleController.getBySlug`). Ça marche parfaitement à l'échelle actuelle, mais ça ne
passerait pas à l'échelle sur des milliers de véhicules. Ajouter une colonne `slug` indexée
est dans le « reste à faire », et si le jury pose la question, c'est la bonne réponse.

### La structure enveloppante

```jsx
<BrowserRouter>
  <ErrorBoundary>       ← attrape les erreurs React et affiche un écran de repli
    <Navbar />          ← hors des Routes : présente sur toutes les pages
    <Suspense>          ← affiche le fallback pendant le chargement d'une page lazy
      <Routes>...</Routes>
    </Suspense>
    <Footer />
  </ErrorBoundary>
</BrowserRouter>
```

L'ordre n'est pas arbitraire :

- `BrowserRouter` englobe tout, sinon `useNavigate` / `useLocation` échouent dans la Navbar
- `ErrorBoundary` est à l'intérieur, pour pouvoir afficher des liens dans l'écran d'erreur
- `Navbar` et `Footer` sont **hors des `Routes`** : ils restent affichés d'une page à l'autre
- `Suspense` n'entoure que les `Routes`, seul endroit où du code est chargé à la demande

`AuthProvider` est encore au-dessus, dans `main.jsx` : la session est disponible partout,
y compris dans la Navbar.

Le garde-barrière lui-même est décrit dans [auth.md](auth.md#protectedroute--le-garde-barrière).

---

## Performance, build et environnement

### Code splitting : `lazy()` + `<Suspense>`

Toutes les pages sont chargées à la demande, **sauf `Home`** :

```jsx
import Home from '@/pages/Home/Home'                             // chargée tout de suite
const Catalogue = lazy(() => import('@/pages/Catalogue/Catalogue'))  // à la demande
```

Home est la page d'arrivée : la charger paresseusement ajouterait un aller-retour réseau
inutile là où l'utilisateur regarde. Tout le reste, et surtout les 5 pages admin, que
99 % des visiteurs ne verront jamais, n'est téléchargé que si on y va.

Le `fallback` de `<Suspense>` vaut `null` : les chunks font quelques kilo-octets, un écran
de chargement clignoterait plus qu'il n'informerait.

### Découpage des dépendances : `vite.config.js`

`manualChunks` sépare `react`, `supabase` et `charts` en fichiers distincts. Les
bibliothèques changent moins souvent que ton code : leur fichier reste en cache navigateur
d'un déploiement à l'autre. Le commentaire du fichier précise que c'est **explicite et non
automatique**, l'heuristique par défaut de Vite ayant déjà changé entre deux versions
mineures.

*(Détail Vite 8 : rolldown attend une fonction `manualChunks(id)`, pas un objet.)*

### Images

Toutes en `.webp` dans `public/img/`. `optimizeImageUrl()` (`lib/utils.js`) sait en plus
réécrire une URL Supabase Storage vers l'API de transformation d'images
(`/render/image/public/?width=...&quality=...&format=webp`) : utile le jour où les photos
seront téléversées plutôt que livrées avec le site.

Les cartes du catalogue chargent les **trois premières images en priorité** : ce sont les
seules visibles sans défilement.

### Dev vs prod : comment `/api` est résolu

| | Dev | Prod |
|---|---|---|
| Front servi par | Vite, port 5173 | Express, depuis `client/dist` |
| `fetch('/api/...')` | proxifié par Vite vers `localhost:3001` (`vite.config.js`) | même origine, Express le traite directement |

C'est pour ça que le code appelle toujours `/api/...` en chemin **relatif**, jamais
`http://localhost:3001/api/...` : le même code marche dans les deux cas, sans variable
d'environnement d'URL d'API.

En dev il faut donc **deux terminaux** : `npm run dev` dans `server/` et dans `client/`.

### Variables d'environnement

Fichier `client/.env` :

```env
VITE_SUPABASE_URL=https://<projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon>
```

Le préfixe `VITE_` est obligatoire : Vite n'expose au navigateur que les variables ainsi
préfixées. Corollaire à bien avoir en tête, **tout ce qui commence par `VITE_` finit dans
le bundle JS et est donc public**. La clé `anon` est faite pour ça ; jamais on ne mettrait
la clé `service_role` ici. Voir
[../back/supabase.md](../back/supabase.md#les-deux-clés-et-la-rls).
