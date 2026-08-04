← [Architecture](README.md)

# Le routing — `src/App.jsx`

C'est le plan du site : 18 routes, toutes visibles d'un coup d'œil.

## Trois niveaux d'accès

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

## Le `:slug` plutôt qu'un `:id`

Les URLs de véhicules sont `/vehicles/bmw-m5-competition` et non
`/vehicles/8f3c1a2e-...`. Le slug est calculé depuis `brand` + `model` par `toSlug()`
(`lib/utils.js`) : minuscules, accents retirés, espaces en tirets.

C'est un choix **SEO et lisibilité** : une URL parlante est mieux référencée et se partage
mieux qu'un UUID.

⚠️ **Limite connue** : il n'y a pas de colonne `slug` en base. Le serveur recalcule donc
le slug de **tous** les véhicules pour retrouver le bon
(`vehicleController.getBySlug`). Ça marche parfaitement à l'échelle actuelle, mais ça ne
passerait pas à l'échelle sur des milliers de véhicules. Ajouter une colonne `slug` indexée
est dans le « reste à faire » — et si le jury pose la question, c'est la bonne réponse.

## La structure enveloppante

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

Le garde-barrière lui-même est décrit dans
[../auth/protected-route.md](../auth/protected-route.md).
