← [Back](README.md)

# Le JWT : l'objet que Supabase signe et que le serveur vérifie

Trois pages se répondent, et il vaut mieux savoir laquelle dit quoi :

| Question | Page |
|---|---|
| **Qui** émet le jeton, avec quelles fonctions ? | [supabase.md, section Supabase Auth](supabase.md#supabase-auth) |
| **Ce qu'est** ce jeton, ce qu'il contient, où il vit | **cette page** |
| **Ce que le serveur en fait** une fois reçu | [securite.md](securite.md#les-deux-middlewares--servermiddlewareauthjs) |

## Ce qu'est un JWT

**JWT** = *JSON Web Token*. Une chaîne en trois parties séparées par des points :

```
eyJhbGciOiJIUzI1NiIs... . eyJzdWIiOiI4ZjNjLi4uIiwicm9sZSI6... . 4f2Xk9_pQm1sT...
└──── HEADER ────┘         └──── PAYLOAD ────┘                  └── SIGNATURE ──┘
```

Le header et le payload sont **encodés en base64url, pas chiffrés** : n'importe qui peut
les lire. Le JWT ne garantit pas le secret, il garantit l'**intégrité** : modifier un seul
caractère du payload invalide la signature, et le serveur rejette le token. Fabriquer une
signature valide demanderait le secret de signature, qui ne quitte jamais Supabase.

> Conséquence : jamais d'information sensible dans un JWT. Un id, un email, un rôle, oui.

Son rôle dans le projet : **prouver l'identité de l'appelant à chaque requête API**, sans
que le serveur ait à stocker la moindre session (voir
[securite.md, le principe général](securite.md#le-principe-général)).

### Ce que contient le payload

```json
{
  "sub": "8f3c1a2e-...",                     ← l'id utilisateur : devient req.user.id
  "exp": 1785312000,                          ← expiration (1 h par défaut)
  "email": "client@example.com",
  "role": "authenticated",                    ← rôle PostgreSQL, utilisé par la RLS
  "app_metadata": { "role": "admin" }         ← LE rôle métier, celui que lit requireAdmin
}
```

### Les deux champs `role` ne servent pas au même mécanisme

C'est le point de confusion classique, et il se lit en croisant les deux pages :

| Champ | Qui le lit | Pour quoi |
|---|---|---|
| `role: "authenticated"` | **PostgreSQL** | Rôle de base de données. C'est lui qui détermine les politiques RLS applicables → [supabase.md, section RLS](supabase.md#la-rls-row-level-security) |
| `app_metadata.role` | **`requireAdmin`** | Rôle métier du projet, `client` ou `admin` → [securite.md](securite.md#le-point-subtil--app_metadata-et-non-user_metadata) |

Le rôle métier est dans `app_metadata` et pas `user_metadata`, parce que seul le
`service_role` peut écrire `app_metadata`. S'il était dans `user_metadata`, n'importe quel
utilisateur pourrait se promouvoir admin depuis sa console avec
`supabase.auth.updateUser({ data: { role: 'admin' } })`.

---

## Pourquoi le serveur peut faire confiance à ce jeton

C'est ici que l'articulation avec Supabase compte le plus, et c'est une question de jury.

Le serveur **ne vérifie pas la signature lui-même**. Il n'a pas le secret de signature,
[les deux clés](supabase.md#les-deux-clés-et-la-rls) qu'il détient (`service_role`) et que
le navigateur détient (`anon`) ne sont pas ce secret. Ce que fait `middleware/auth.js`,
c'est appeler `supabase.auth.getUser(token)` : **il délègue la vérification à Supabase**,
qui contrôle la signature et l'expiration et renvoie l'utilisateur.

> Ne jamais dire à l'oral « je vérifie la signature avec la clé publique ». Ce serait faux.
> La bonne phrase : « je délègue la vérification à Supabase, parce que la clé de signature
> ne quitte jamais Supabase ».

La contrepartie assumée : ça fait un appel réseau à chaque requête protégée. Vérifier la
signature en local serait plus rapide, c'est une optimisation identifiée, pas un oubli.

`getUser(token)` est d'ailleurs la **seule** fonction d'Auth appelée côté serveur avec
`deleteUser` et `getUserById` ; toutes les autres sont côté navigateur. Le tableau complet
est dans [supabase.md](supabase.md#les-fonctions-dauth-utilisées).

---

## Où il vit physiquement

Dans le **`localStorage` du navigateur**, sous la clé `sb-<ref-projet>-auth-token`. C'est
`supabase-js` qui l'y écrit, pas le code du projet. Tu peux l'ouvrir toi-même :
DevTools → Application → Local Storage.

```json
{ "access_token": "<LE JWT>", "refresh_token": "...", "expires_at": ..., "user": { ... } }
```

Il y a donc **deux jetons**, et ils ne circulent pas de la même façon :

| Jeton | Durée | Envoyé à l'API Express ? |
|---|---|---|
| `access_token` | 1 h | **Oui** : c'est le JWT, dans `Authorization: Bearer` |
| `refresh_token` | longue | **Jamais** : il ne sert qu'à demander un nouvel `access_token` à Supabase |

Côté serveur : **nulle part**. Aucune table de sessions. Le token arrive, sert le temps de
la requête, et est oublié.

## Son parcours

```
┌─ NAVIGATEUR ────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. pages/Login/Login.jsx → lib/auth.js                                      │
│         supabase.auth.signInWithPassword()                                   │
│                                                                              │
│  2. Supabase Auth vérifie le mot de passe et SIGNE le JWT                    │
│         → mon serveur est ABSENT de cette étape                              │
│                                                                              │
│  3. supabase-js écrit la session dans le localStorage                        │
│         clé : sb-<ref-projet>-auth-token                                     │
│         { access_token: <LE JWT>, refresh_token, expires_at, user }          │
│                                                                              │
│  4. lib/AuthContext.jsx - onAuthStateChange se déclenche                     │
│         setUser(session.user) → Navbar, ProtectedRoute... se mettent à jour     │
│                                                                              │
│  5. À chaque appel protégé :                                                 │
│         await supabase.auth.getSession()                                     │
│         fetch('/api/...', { headers: { Authorization: `Bearer ${token}` } })  │
└──────────────────────────────────────────────┬───────────────────────────────┘
                                               │  HTTP
┌─ SERVEUR EXPRESS ─────────────────────────────▼──────────────────────────────┐
│                                                                              │
│  6. middleware/auth.js - getTokenFromHeader(req)                             │
│         extrait la chaîne après "Bearer "                                    │
│                                                                              │
│  7. middleware/auth.js - verifyToken(token)                                  │
│         supabase.auth.getUser(token) → Supabase vérifie signature+expiration │
│         → échec : 401 « Token invalide ou expiré. »                          │
│                                                                              │
│  8. requireAdmin en plus : user.app_metadata?.role === 'admin' ?             │
│         → non : 403 « Accès réservé aux administrateurs. »                   │
│                                                                              │
│  9. req.user = user → le contrôleur peut faire confiance à req.user.id       │
│                                                                              │
│ 10. controllers/reservationController.js                                     │
│         create : client_id = req.user.id   (jamais req.body.client_id)       │
│         cancel : reservation.client_id !== req.user.id → 403                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

Les étapes 1 à 5 sont détaillées côté React dans
[../front/auth.md](../front/auth.md#le-parcours-complet-dune-connexion) ;
les étapes 6 à 10 dans [securite.md](securite.md#les-deux-middlewares--servermiddlewareauthjs).

## Le renouvellement

L'`access_token` expire au bout d'**1 heure**. Le `refresh_token`, gardé lui aussi dans le
`localStorage` et jamais envoyé à l'API, permet à `supabase-js` d'en obtenir un nouveau
automatiquement (~55 min).

C'est la raison pour laquelle chaque appel refait `getSession()` juste avant le `fetch`,
au lieu de garder le token dans un `useState` : qui serait périmé au bout d'une heure
(voir [../front/donnees.md, le motif d'appel](../front/donnees.md#le-motif-dappel-à-lapi)).

---

## Ce qu'un attaquant peut, ou non, en faire

| Tentative | Résultat |
|---|---|
| **Lire le contenu du token** | **Possible**, et volontaire. C'est signé, pas chiffré. D'où l'absence de données sensibles dedans. |
| **Changer `role: client` en `role: admin`** | **Impossible**. La signature ne colle plus, Supabase rejette → **401**. Et le rôle est dans `app_metadata`, que l'utilisateur ne peut pas écrire lui-même. |
| **Fabriquer un token de toutes pièces** | **Impossible**. Il faudrait le secret de signature, qui ne quitte jamais Supabase. |
| **Voler le token** | **Partiellement**. Il agit comme la victime, **1 h maximum**. Il ne peut ni en déduire le mot de passe, ni en obtenir un nouveau : le `refresh_token` n'est jamais envoyé à l'API. |
| **Annuler la réservation d'un autre avec son propre token** | **Impossible**. Le `client_id` vient toujours du token, jamais du body. C'est l'anti-IDOR, et c'est couvert par un test → [securite.md](securite.md#les-contrôles-métier) |

Le stockage en `localStorage` expose au **XSS** (un script injecté peut le lire) mais pas au
**CSRF** (il n'est pas dans un cookie, donc pas envoyé automatiquement par le navigateur).
D'où le cookie `httpOnly` en tête des améliorations identifiées.
