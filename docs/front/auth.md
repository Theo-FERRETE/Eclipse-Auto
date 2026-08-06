← [Front](README.md)

# Front : l'authentification

Trois fichiers, et c'est tout :

| Fichier | Rôle |
|---|---|
| `lib/auth.js` | Les fonctions brutes : login, register, logout, session, profil |
| `lib/AuthContext.jsx` | Le contexte React qui rend la session disponible partout |
| `components/ProtectedRoute/ProtectedRoute.jsx` | Le garde-barrière des routes privées |

## `lib/auth.js` : les fonctions brutes

De simples enveloppes autour de Supabase Auth. Elles **lèvent une exception** en cas
d'erreur (`if (error) throw error`), à charge des pages appelantes de les attraper dans un
`try/catch` pour afficher le message.

| Fonction | Appel Supabase |
|---|---|
| `login(email, password)` | `auth.signInWithPassword()` |
| `register(email, password, firstName, lastName)` | `auth.signUp()` : prénom/nom passés en `options.data` |
| `logout()` | `auth.signOut()` |
| `getSession()` | `auth.getSession()` |
| `getProfile()` | `auth.getUser()` puis `from('profiles').select().eq('id', user.id).single()` |

**Le mot de passe ne transite jamais par ton serveur.** Il part directement du navigateur
vers Supabase, qui le hashe et le stocke. Le projet ne détient aucun mot de passe, c'est
un argument de sécurité solide à donner à l'oral.

## `lib/AuthContext.jsx` : la session partagée

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
| `user` | L'utilisateur Supabase Auth (id, email...) ou `null` |
| `profile` | La ligne `profiles` correspondante (first_name, last_name, role...) |
| `loading` | `true` tant que la session initiale n'est pas résolue |
| `isAdmin` | `profile?.role === 'admin'` |
| `isClient` | `profile?.role === 'client'` |
| `refreshProfile()` | Recharge le profil (après modification dans le Dashboard) |

### Pourquoi un Context et pas un état local

Sans lui, chaque composant devrait appeler `getSession()` de son côté : la Navbar, le
Dashboard, `ProtectedRoute`... Autant d'appels redondants et de risques de désynchronisation.
Le Context résout la session **une fois** et la diffuse à tout l'arbre.

C'est aussi ce qui évite le *prop drilling*, passer `user` de composant en composant sur
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

- `getSession()` répond à « suis-je *déjà* connecté ? », au chargement de la page, la
  session vient du `localStorage`, c'est pour ça qu'on reste connecté après un F5.
- `onAuthStateChange()` répond à « quelque chose *change*-t-il ? », connexion, déconnexion,
  expiration. Sans lui, se connecter n'aurait aucun effet visible avant un rechargement
  manuel, et la Navbar continuerait d'afficher « Connexion ».

### Le rôle de `loading` : et pourquoi il est indispensable

Au premier rendu, `user` vaut `null` : la session n'est pas encore lue. Sans `loading`,
`ProtectedRoute` verrait `user === null` et redirigerait immédiatement vers `/login` :
**même un utilisateur connecté serait éjecté de son dashboard à chaque rechargement**.

`loading` dit « je ne sais pas encore, attends ». C'est un des bugs les plus classiques de
l'auth côté React, et une très bonne réponse si le jury demande une difficulté rencontrée.

---

## ProtectedRoute : le garde-barrière

Quinze lignes, trois décisions dans l'ordre :

```jsx
if (loading) return null                                   // 1. on attend
if (!user) return <Navigate to="/login" replace />         // 2. pas connecté
if (requireAdmin && profile?.role !== 'admin')             // 3. pas admin
  return <Navigate to="/dashboard" replace />
return children                                            // 4. laissez passer
```

Usage dans `App.jsx` :

```jsx
<ProtectedRoute><Dashboard /></ProtectedRoute>                    // connecté
<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>  // admin
```

**Le `replace`** remplace l'entrée dans l'historique au lieu d'en ajouter une. Sans lui,
le bouton Précédent renverrait sur la page protégée, qui redirigerait à nouveau vers
`/login` : l'utilisateur serait piégé dans une boucle.

**Un non-admin est renvoyé vers `/dashboard`, pas vers `/login`** : il est bien connecté,
lui redemander de se connecter n'aurait aucun sens.

### Le point à ne pas rater : ce composant ne sécurise RIEN

`ProtectedRoute` est du **confort d'interface**, pas de la sécurité.

Il empêche d'afficher une page. Il n'empêche pas d'appeler l'API. N'importe qui peut ouvrir
la console de son navigateur, forcer `profile.role = 'admin'` et faire apparaître le menu
admin. Mais chaque appel vers `/api/admin/*` partirait quand même avec **son** JWT, et le
serveur le rejetterait en **403** : parce que le rôle qui fait foi est dans
`app_metadata`, inscrit dans un token signé, impossible à falsifier depuis le navigateur.

> **Le front décide ce qu'on voit. Le serveur décide ce qu'on peut faire.**

Détail cohérent avec ça : le front lit le rôle dans `profiles.role` (une colonne de table,
pratique pour l'affichage), le serveur le lit dans `app_metadata.role` (dans le JWT).
Deux sources différentes pour deux usages différents, c'est expliqué en détail dans
[../back/securite.md](../back/securite.md#attention--deux-notions-de--admin--cohabitent).

---

## Le parcours complet d'une connexion

```text
1. L'utilisateur saisit ses identifiants          pages/Login/Login.jsx
2. login(email, password)                          lib/auth.js
3. signInWithPassword() → Supabase Auth vérifie le mot de passe
4. Retour d'un JWT + refresh token, stockés dans le localStorage par la librairie
5. onAuthStateChange se déclenche                  lib/AuthContext.jsx
6. setUser(session.user) + loadProfile(id) → profiles
7. Tout l'arbre React se re-rend :
      • la Navbar affiche le nom + le lien Admin si isAdmin
      • ProtectedRoute laisse passer
8. Chaque appel à l'API joint le token :
      Authorization: Bearer <access_token>
9. Le serveur le vérifie                           server/middleware/auth.js
```

Le détail du jeton, où il vit, ce qu'il contient, combien de temps, est dans
[../back/JWT.md](../back/JWT.md).

## Le mot de passe oublié

Deux pages, un aller-retour par email, géré entièrement par Supabase Auth, sans code
serveur :

1. **`pages/ForgotPassword`** : `supabase.auth.resetPasswordForEmail(email)`.
   Supabase envoie un email contenant un lien de retour vers le site.
2. **`pages/ResetPassword`** : le lien ouvre cette page avec un token de récupération dans
   l'URL. La page écoute `supabase.auth.onAuthStateChange()` pour attendre que la librairie
   ait consommé ce token et ouvert une session temporaire ; puis
   `supabase.auth.updateUser({ password })` enregistre le nouveau mot de passe.

À noter : ce sont les deux seules pages, avec le Dashboard, à parler à Supabase Auth
directement plutôt qu'à l'API, parce qu'il s'agit de la gestion de son propre compte,
et que Supabase le fait déjà correctement.
