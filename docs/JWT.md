# Le JWT — ce qu'il fait et son parcours

## Ce qu'il fait

**JWT** = *JSON Web Token*. Une chaîne en trois parties séparées par des points :

```
eyJhbGciOiJIUzI1NiIs... . eyJzdWIiOiI4ZjNjLi4uIiwicm9sZSI6... . 4f2Xk9_pQm1sT...
└──── HEADER ────┘         └──── PAYLOAD ────┘                  └── SIGNATURE ──┘
```

Le header et le payload sont **encodés en base64url, pas chiffrés** : n'importe qui peut
les lire. Le JWT ne garantit pas le secret, il garantit l'**intégrité** — modifier un seul
caractère du payload invalide la signature, et le serveur rejette le token. Fabriquer une
signature valide demanderait le secret de signature, qui ne quitte jamais Supabase.

> Conséquence : jamais d'information sensible dans un JWT. Un id, un email, un rôle — oui.

Son rôle dans le projet : **prouver l'identité de l'appelant à chaque requête API**, sans
que le serveur ait à stocker la moindre session.

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

Le rôle métier est dans `app_metadata` et pas `user_metadata`, parce que seul le
`service_role` peut écrire `app_metadata`. S'il était dans `user_metadata`, n'importe quel
utilisateur pourrait se promouvoir admin depuis sa console avec
`supabase.auth.updateUser({ data: { role: 'admin' } })`.

---

## Son parcours

```
┌─ NAVIGATEUR ────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. pages/Login/Login.jsx → lib/auth.js                                      │
│         supabase.auth.signInWithPassword()                                   │
│                                                                              │
│  2. Supabase Auth vérifie le mot de passe et SIGNE le JWT                    │
│                                                                              │
│  3. supabase-js écrit la session dans le localStorage                        │
│         clé : sb-<ref-projet>-auth-token                                     │
│         { access_token: <LE JWT>, refresh_token, expires_at, user }          │
│                                                                              │
│  4. lib/AuthContext.jsx — onAuthStateChange se déclenche                     │
│         setUser(session.user) → Navbar, ProtectedRoute… se mettent à jour     │
│                                                                              │
│  5. À chaque appel protégé :                                                 │
│         await supabase.auth.getSession()                                     │
│         fetch('/api/...', { headers: { Authorization: `Bearer ${token}` } })  │
└──────────────────────────────────────────────┬───────────────────────────────┘
                                               │  HTTP
┌─ SERVEUR EXPRESS ─────────────────────────────▼──────────────────────────────┐
│                                                                              │
│  6. middleware/auth.js — getTokenFromHeader(req)                             │
│         extrait la chaîne après "Bearer "                                    │
│                                                                              │
│  7. middleware/auth.js — verifyToken(token)                                  │
│         supabase.auth.getUser(token) vérifie SIGNATURE et EXPIRATION         │
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

Le serveur ne stocke **jamais** le token : il le reçoit, le vérifie, s'en sert le temps de
la requête, et l'oublie. Aucune table de sessions — l'API est *stateless*.

### Le renouvellement

L'`access_token` expire au bout d'**1 heure**. Le `refresh_token`, gardé lui aussi dans le
`localStorage` et jamais envoyé à l'API, permet à `supabase-js` d'en obtenir un nouveau
automatiquement (~55 min).

C'est la raison pour laquelle chaque appel refait `getSession()` juste avant le `fetch`,
au lieu de garder le token dans un `useState` — qui serait périmé au bout d'une heure.

---

## Pour aller plus loin

- [back/securite.md](back/securite.md) — les middlewares, 401 vs 403
- [back/supabase.md — les deux clés et la RLS](back/supabase.md#les-deux-clés-et-la-rls)
- [front/auth.md](front/auth.md) — `AuthContext` et le cycle de session
