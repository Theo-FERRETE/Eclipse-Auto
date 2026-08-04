← [Authentification](README.md)

# `ProtectedRoute` — le garde-barrière

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
`/login` — l'utilisateur serait piégé dans une boucle.

**Un non-admin est renvoyé vers `/dashboard`, pas vers `/login`** : il est bien connecté,
lui redemander de se connecter n'aurait aucun sens.

## Le point à ne pas rater : ce composant ne sécurise RIEN

`ProtectedRoute` est du **confort d'interface**, pas de la sécurité.

Il empêche d'afficher une page. Il n'empêche pas d'appeler l'API. N'importe qui peut ouvrir
la console de son navigateur, forcer `profile.role = 'admin'` et faire apparaître le menu
admin. Mais chaque appel vers `/api/admin/*` partirait quand même avec **son** JWT, et le
serveur le rejetterait en **403** — parce que le rôle qui fait foi est dans
`app_metadata`, inscrit dans un token signé, impossible à falsifier depuis le navigateur.

> **Le front décide ce qu'on voit. Le serveur décide ce qu'on peut faire.**

Détail cohérent avec ça : le front lit le rôle dans `profiles.role` (une colonne de table,
pratique pour l'affichage), le serveur le lit dans `app_metadata.role` (dans le JWT).
Deux sources différentes pour deux usages différents — c'est expliqué en détail dans
[../../back/securite/README.md](../../back/securite/README.md).
