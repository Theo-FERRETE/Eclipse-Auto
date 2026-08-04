← [Supabase](README.md)

# Supabase Auth — comment marche la connexion

1. Le front appelle `supabase.auth.signInWithPassword({ email, password })`
   (`client/src/lib/auth.js`).
2. Supabase vérifie le mot de passe (hashé chez lui — le projet ne stocke **jamais** de
   mot de passe) et renvoie un **JWT** (`access_token`) + un refresh token.
3. La librairie stocke la session dans le `localStorage` du navigateur et la rafraîchit
   toute seule à l'expiration.
4. À chaque appel à l'API, le front récupère ce token et l'envoie :
   `Authorization: Bearer <access_token>`.
5. Le serveur le vérifie avec `supabase.auth.getUser(token)` dans `middleware/auth.js`.

**Ce qu'il faut retenir** : le JWT est signé par Supabase. Un utilisateur ne peut ni le
fabriquer ni en modifier le contenu — la signature ne collerait plus. C'est ce qui rend
`req.user.id` digne de confiance côté serveur, et c'est pourquoi le `client_id` d'une
réservation est **forcé depuis le token**, jamais lu depuis le body de la requête.

## Les fonctions d'Auth utilisées

| Fonction | Où | Note |
|---|---|---|
| `signInWithPassword()` | front | connexion |
| `signUp()` | front | inscription, avec `first_name` / `last_name` en métadonnées |
| `signOut()` | front | déconnexion |
| `getSession()` | front | relit la session avant chaque appel à l'API |
| `onAuthStateChange()` | front | met à jour l'interface au changement de session |
| `resetPasswordForEmail()` / `updateUser()` | front | mot de passe oublié |
| `getUser(token)` | **serveur** | valide le JWT reçu |
| `auth.admin.deleteUser(id)` | **serveur** | supprime le compte auth (le profil suit). Impossible avec la clé `anon` |
| `auth.admin.getUserById(id)` | **serveur** | récupère l'email d'un client pour la confirmation |

Le détail complet du jeton — où il est stocké, ce qu'il contient, par où il passe — est
dans [../../JWT.md](../../JWT.md).
