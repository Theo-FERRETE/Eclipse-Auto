← [Authentification](README.md)

# Le parcours complet d'une connexion

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

Le détail du jeton — où il vit, ce qu'il contient, combien de temps — est dans
[../../JWT.md](../../JWT.md).

## Le mot de passe oublié

Deux pages, un aller-retour par email — géré entièrement par Supabase Auth, sans code
serveur :

1. **`pages/ForgotPassword`** — `supabase.auth.resetPasswordForEmail(email)`.
   Supabase envoie un email contenant un lien de retour vers le site.
2. **`pages/ResetPassword`** — le lien ouvre cette page avec un token de récupération dans
   l'URL. La page écoute `supabase.auth.onAuthStateChange()` pour attendre que la librairie
   ait consommé ce token et ouvert une session temporaire ; puis
   `supabase.auth.updateUser({ password })` enregistre le nouveau mot de passe.

À noter : ce sont les deux seules pages, avec le Dashboard, à parler à Supabase Auth
directement plutôt qu'à l'API — parce qu'il s'agit de la gestion de son propre compte,
et que Supabase le fait déjà correctement.
