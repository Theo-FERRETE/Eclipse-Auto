← [Front](../README.md)

# Front — l'authentification

Trois fichiers, et c'est tout :

| Fichier | Rôle |
|---|---|
| `lib/auth.js` | Les fonctions brutes : login, register, logout, session, profil |
| `lib/AuthContext.jsx` | Le contexte React qui rend la session disponible partout |
| `components/ProtectedRoute/ProtectedRoute.jsx` | Le garde-barrière des routes privées |

| Page | Contenu |
|---|---|
| **Cette page** | `auth.js` et `AuthContext` : les fonctions et la session partagée |
| [protected-route.md](protected-route.md) | Le garde-barrière, et pourquoi il ne sécurise rien |
| [parcours.md](parcours.md) | La connexion de bout en bout, et le mot de passe oublié |

---

## `lib/auth.js` — les fonctions brutes

De simples enveloppes autour de Supabase Auth. Elles **lèvent une exception** en cas
d'erreur (`if (error) throw error`), à charge des pages appelantes de les attraper dans un
`try/catch` pour afficher le message.

| Fonction | Appel Supabase |
|---|---|
| `login(email, password)` | `auth.signInWithPassword()` |
| `register(email, password, firstName, lastName)` | `auth.signUp()` — prénom/nom passés en `options.data` |
| `logout()` | `auth.signOut()` |
| `getSession()` | `auth.getSession()` |
| `getProfile()` | `auth.getUser()` puis `from('profiles').select().eq('id', user.id).single()` |

**Le mot de passe ne transite jamais par ton serveur.** Il part directement du navigateur
vers Supabase, qui le hashe et le stocke. Le projet ne détient aucun mot de passe — c'est
un argument de sécurité solide à donner à l'oral.

## `lib/AuthContext.jsx` — la session partagée

Monté tout en haut de l'application, dans `main.jsx` :

```jsx
<StrictMode>
  <AuthProvider>
    <App />
  </AuthProvider>
</StrictMode>
```

Ce qu'il expose via `useAuth()` :

| Valeur | Contenu |
|---|---|
| `user` | L'utilisateur Supabase Auth (id, email…) ou `null` |
| `profile` | La ligne `profiles` correspondante (first_name, last_name, role…) |
| `loading` | `true` tant que la session initiale n'est pas résolue |
| `isAdmin` | `profile?.role === 'admin'` |
| `isClient` | `profile?.role === 'client'` |
| `refreshProfile()` | Recharge le profil (après modification dans le Dashboard) |

### Pourquoi un Context et pas un état local

Sans lui, chaque composant devrait appeler `getSession()` de son côté : la Navbar, le
Dashboard, `ProtectedRoute`… Autant d'appels redondants et de risques de désynchronisation.
Le Context résout la session **une fois** et la diffuse à tout l'arbre.

C'est aussi ce qui évite le *prop drilling* — passer `user` de composant en composant sur
cinq niveaux jusqu'à celui qui en a besoin.

### Le cycle de vie, dans le `useEffect`

```text
Montage
  │
  ├── supabase.auth.getSession()          Session existante ? (relue du localStorage)
  │        ├── oui → loadProfile(id) → setLoading(false)
  │        └── non → setLoading(false)
  │
  └── supabase.auth.onAuthStateChange()   Abonnement aux changements
           │
           ├── connexion   → setUser + loadProfile
           ├── déconnexion → setUser(null) + setProfile(null)
           └── rafraîchissement automatique du token

Démontage
  └── subscription.unsubscribe()          Sinon : fuite mémoire
```

**Les deux étapes sont nécessaires et différentes** :

- `getSession()` répond à « suis-je *déjà* connecté ? » — au chargement de la page, la
  session vient du `localStorage`, c'est pour ça qu'on reste connecté après un F5.
- `onAuthStateChange()` répond à « quelque chose *change*-t-il ? » — connexion, déconnexion,
  expiration. Sans lui, se connecter n'aurait aucun effet visible avant un rechargement
  manuel, et la Navbar continuerait d'afficher « Connexion ».

### Le rôle de `loading` — et pourquoi il est indispensable

Au premier rendu, `user` vaut `null` : la session n'est pas encore lue. Sans `loading`,
`ProtectedRoute` verrait `user === null` et redirigerait immédiatement vers `/login` —
**même un utilisateur connecté serait éjecté de son dashboard à chaque rechargement**.

`loading` dit « je ne sais pas encore, attends ». C'est un des bugs les plus classiques de
l'auth côté React, et une très bonne réponse si le jury demande une difficulté rencontrée.
