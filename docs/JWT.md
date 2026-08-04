# Le JWT — où est le tien, et ce qu'il fait

Ce document répond à une question concrète : **où se trouve physiquement mon jeton
d'authentification**, à quoi il ressemble, et par où il passe dans Eclipse Auto.

---

## 1. Un JWT, c'est quoi exactement

**JWT** = *JSON Web Token*. C'est une chaîne de caractères en trois morceaux séparés par
des points :

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOiI4ZjNjLi4uIiwicm9sZSI6ImF1dGgi... . 4f2Xk9_pQm1sT...
└──────────── 1. HEADER ────────────┘   └──────────── 2. PAYLOAD ────────────┘   └── 3. SIGNATURE ──┘
```

| Partie | Contenu | Lisible ? |
|---|---|---|
| **Header** | L'algorithme de signature (`HS256`) et le type (`JWT`) | Oui |
| **Payload** | Les informations sur l'utilisateur : id, email, rôle, expiration | **Oui** |
| **Signature** | Le header + le payload, hachés avec le secret de Supabase | Non |

### Le point le plus contre-intuitif : ce n'est PAS chiffré

Le header et le payload sont simplement encodés en **base64url**, pas chiffrés. N'importe
qui peut les lire — il suffit de coller le token sur [jwt.io](https://jwt.io) ou de faire
un `atob()` dans la console.

Alors à quoi ça sert ? **Le JWT ne garantit pas le secret, il garantit l'intégrité.**

Tu peux lire le contenu, mais tu ne peux pas le **modifier** : dès que tu changes un
caractère du payload, la signature ne correspond plus, et le serveur rejette le token.
Fabriquer une signature valide demanderait le secret de signature, qui ne quitte jamais
Supabase.

> **Conséquence concrète** : ne mets jamais d'information sensible dans un JWT. Un id, un
> email et un rôle, oui. Un mot de passe ou un numéro de carte, jamais.

---

## 2. Où est TON JWT — les quatre emplacements

### Emplacement n°1 — le `localStorage` de ton navigateur ⭐ la vraie réponse

C'est **là** qu'il vit. La librairie `@supabase/supabase-js` l'y écrit toute seule dès la
connexion réussie, sous une clé nommée d'après ton projet Supabase :

```
sb-<référence-du-projet>-auth-token
```

La référence du projet est le sous-domaine de ton `VITE_SUPABASE_URL`. Tu n'as pas besoin
de la connaître par cœur : dans le stockage local, c'est **la seule clé qui commence par
`sb-` et finit par `-auth-token`**.

La valeur n'est pas le JWT nu, c'est un objet JSON qui le contient :

```json
{
  "access_token":  "eyJhbGciOiJIUzI1NiIs...",   ← LE JWT, celui qui part vers l'API
  "refresh_token": "v1.MRq9...",                 ← sert à en obtenir un nouveau
  "expires_at":    1785312000,
  "expires_in":    3600,
  "token_type":    "bearer",
  "user":          { "id": "...", "email": "...", "app_metadata": { ... } }
}
```

**Pourquoi le `localStorage` et pas un cookie ?** Parce que c'est le comportement par
défaut de `supabase-js` dans le navigateur, et c'est aussi ce qui permet de rester connecté
après un F5 : au chargement de la page, `AuthContext` appelle `getSession()`, qui relit
cette clé. Sans elle, chaque rechargement déconnecterait l'utilisateur.

### Emplacement n°2 — en mémoire, dans la librairie Supabase

Une fois lu, le token est gardé en mémoire par le client `supabase` créé dans
[`client/src/lib/supabase.js`](../client/src/lib/supabase.js). C'est cette copie que
`supabase.auth.getSession()` renvoie instantanément, sans relire le `localStorage`.

### Emplacement n°3 — dans l'en-tête HTTP, à chaque appel à l'API

À chaque requête vers `/api/...`, le token est recopié dans un en-tête :

```http
PATCH /api/reservations/9a3f.../cancel HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZjNj...
```

Le mot `Bearer` (« porteur ») est une convention HTTP standard : *celui qui présente ce
jeton est autorisé*. C'est exactement pour ça que le token doit rester privé — quiconque
le copie peut agir à ta place jusqu'à son expiration.

Dans le code, ça arrive à 9 endroits, toujours avec le même motif :

```js
const { data: { session } } = await supabase.auth.getSession()
fetch('/api/...', { headers: { Authorization: `Bearer ${session?.access_token}` } })
```

### Emplacement n°4 — nulle part côté serveur ⚠️

**Le serveur ne stocke jamais le JWT.** Il le reçoit, le vérifie, s'en sert pendant la
durée de la requête, et l'oublie. Il n'y a aucune table de sessions, aucun cache de tokens.

C'est ce qu'on appelle une API *stateless*. Avantage : redémarrer le serveur ne déconnecte
personne, et n'importe quelle instance peut traiter n'importe quelle requête.

---

## 3. Comment voir ton JWT toi-même — mode d'emploi

**Étape 1 — le trouver dans le stockage**
1. Connecte-toi sur le site
2. `F12` → onglet **Application** (Chrome/Edge) ou **Stockage** (Firefox)
3. Dans la colonne de gauche : **Local Storage** → `http://localhost:5173`
4. Repère la clé qui commence par `sb-` et finit par `-auth-token`
5. Le champ `access_token` de la valeur JSON, c'est ton JWT

**Étape 2 — lire son contenu**
Copie la valeur de `access_token`, puis dans la console :

```js
JSON.parse(atob(monToken.split('.')[1]))
```

Ou colle-le sur [jwt.io](https://jwt.io), qui décode les trois parties visuellement.

**Étape 3 — le voir partir sur le réseau**
1. `F12` → onglet **Réseau**
2. Va sur ton espace client (`/dashboard`)
3. Clique sur la requête `reservations`
4. Section **En-têtes de requête** → la ligne `Authorization: Bearer eyJ...`

**Étape 4 — vérifier qu'il protège vraiment**
Rejoue la même requête sans l'en-tête, depuis la console :

```js
await fetch('/api/reservations').then(r => r.status)   // → 401
```

C'est une démonstration très parlante à faire devant un jury.

---

## 4. Ce que contient le payload

Décodé, le payload d'un JWT Supabase ressemble à ceci :

```json
{
  "iss": "https://<ref-projet>.supabase.co/auth/v1",
  "sub": "8f3c1a2e-4b5d-6789-...",        ← l'id utilisateur : c'est req.user.id
  "aud": "authenticated",
  "exp": 1785312000,                       ← date d'expiration (timestamp Unix)
  "iat": 1785308400,                       ← date d'émission
  "email": "client@example.com",
  "role": "authenticated",                 ← ⚠️ rôle PostgreSQL, pas le rôle métier
  "app_metadata": {
    "provider": "email",
    "role": "admin"                        ← ⭐ LE rôle métier, celui qui fait foi
  },
  "user_metadata": {
    "first_name": "Théo",
    "last_name": "Ferreté"
  },
  "session_id": "..."
}
```

### ⚠️ Le piège des deux champs `role`

C'est **la** subtilité à maîtriser pour l'oral, parce qu'un jury peut la relever :

| Champ | Valeur typique | À quoi il sert |
|---|---|---|
| `role` (racine) | `"authenticated"` | Le rôle **PostgreSQL**. C'est lui que la RLS utilise pour savoir si tu es un visiteur anonyme ou un utilisateur connecté. Rien à voir avec « admin » |
| `app_metadata.role` | `"client"` ou `"admin"` | Le rôle **métier**, ajouté par toi. C'est celui que lit `requireAdmin` |

### Pourquoi `app_metadata` et pas `user_metadata`

| Champ | Qui peut l'écrire ? |
|---|---|
| `user_metadata` | **L'utilisateur lui-même**, via `supabase.auth.updateUser()` depuis son navigateur |
| `app_metadata` | **Seulement** le back-office Supabase ou la clé `service_role` |

Si le rôle admin était rangé dans `user_metadata`, n'importe quel utilisateur connecté
pourrait se promouvoir administrateur en une ligne dans sa console :

```js
// ❌ marcherait si le rôle était dans user_metadata
await supabase.auth.updateUser({ data: { role: 'admin' } })
```

C'est pour ça que [`server/middleware/auth.js`](../server/middleware/auth.js) lit
`user.app_metadata?.role` et rien d'autre.

---

## 5. Le cycle de vie : deux jetons, pas un

Il y a **deux** jetons dans la session, avec des rôles opposés :

| | `access_token` (le JWT) | `refresh_token` |
|---|---|---|
| Durée de vie | **1 heure** (défaut Supabase) | Longue (plusieurs jours) |
| Envoyé à l'API ? | Oui, à chaque requête | Non, jamais |
| Rôle | Prouver qui tu es | Obtenir un nouvel `access_token` |

```
Connexion
   │
   ├── access_token  (1 h)  ──► envoyé à chaque appel /api
   └── refresh_token        ──► gardé au chaud dans le localStorage
                                    │
            au bout de ~55 min, supabase-js l'utilise automatiquement
                                    │
                                    ▼
                        nouvel access_token, sans rien demander
```

**Pourquoi une durée si courte ?** Si un token fuite, la fenêtre d'exploitation est limitée
à une heure. Le `refresh_token`, lui, peut être révoqué côté Supabase — ce qui déconnecte
réellement l'utilisateur.

### La conséquence dans ton code

C'est **la raison** pour laquelle tous les appels font `getSession()` juste avant le
`fetch`, au lieu de garder le token dans un `useState` :

```js
// ✅ ce que fait le projet — on relit à chaque fois
const { data: { session } } = await supabase.auth.getSession()
fetch('/api/...', { headers: { Authorization: `Bearer ${session?.access_token}` } })

// ❌ ce qu'il ne faut pas faire
const [token, setToken] = useState(null)   // périmé au bout d'une heure → 401
```

`getSession()` renvoie toujours un token valide : si l'ancien a expiré, la librairie l'a
déjà remplacé en arrière-plan.

---

## 6. Le trajet complet dans ton code

```
┌─ NAVIGATEUR ────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. pages/Login/Login.jsx                                                    │
│         └── login(email, password)          lib/auth.js                      │
│                 └── supabase.auth.signInWithPassword()                       │
│                                                                              │
│  2. Supabase Auth vérifie le mot de passe (hashé chez lui) et SIGNE le JWT   │
│                                                                              │
│  3. supabase-js écrit la session dans le localStorage                        │
│         clé : sb-<ref-projet>-auth-token                                     │
│                                                                              │
│  4. lib/AuthContext.jsx — onAuthStateChange se déclenche                     │
│         setUser(session.user) + loadProfile(id)                              │
│         → toute l'interface se met à jour (Navbar, ProtectedRoute…)          │
│                                                                              │
│  5. À chaque appel protégé :                                                 │
│         supabase.auth.getSession()  →  Authorization: Bearer <JWT>           │
└──────────────────────────────────────────────┬───────────────────────────────┘
                                               │  HTTP
┌─ SERVEUR EXPRESS ─────────────────────────────▼──────────────────────────────┐
│                                                                              │
│  6. middleware/auth.js — getTokenFromHeader(req)                             │
│         extrait la chaîne après "Bearer "                                    │
│                                                                              │
│  7. middleware/auth.js — verifyToken(token)                                  │
│         supabase.auth.getUser(token)                                         │
│         → Supabase vérifie la SIGNATURE et l'EXPIRATION                      │
│         → échec : 401 « Token invalide ou expiré. »                          │
│                                                                              │
│  8. requireAdmin en plus : user.app_metadata?.role === 'admin' ?             │
│         → non : 403 « Accès réservé aux administrateurs. »                   │
│                                                                              │
│  9. req.user = user   →   le contrôleur peut faire confiance à req.user.id   │
│                                                                              │
│ 10. controllers/reservationController.js                                     │
│         create : client_id = req.user.id   (jamais req.body.client_id)       │
│         cancel : reservation.client_id !== req.user.id → 403                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Ce qu'un attaquant peut et ne peut pas faire

| Tentative | Résultat | Pourquoi |
|---|---|---|
| Lire le contenu de son propre JWT | ✅ Ça marche | Le payload est en base64, pas chiffré. Ce n'est pas une faille |
| Changer `"role": "client"` en `"admin"` dans le payload | ❌ 401 | La signature ne correspond plus au contenu modifié |
| Fabriquer un JWT de toutes pièces | ❌ 401 | Il faudrait le secret de signature, qui est chez Supabase |
| Réutiliser un token expiré | ❌ 401 | `getUser()` contrôle le champ `exp` |
| Forcer `profile.role = 'admin'` dans la console React | ⚠️ Le menu Admin apparaît… | …mais chaque appel `/api/admin/*` part avec **son** JWT → **403** |
| Envoyer `client_id: <autre-utilisateur>` en créant une réservation | ❌ Sans effet | Le contrôleur ignore le body et prend `req.user.id` |
| Appeler `PATCH /reservations/:id/cancel` sur la réservation d'un autre | ❌ 403 | Le contrôleur compare `client_id` à `req.user.id` |
| Voler le JWT (XSS, poste partagé, extension malveillante) | ⚠️ **Ça marche**, pendant 1 h max | C'est la vraie limite du `localStorage`. Voir ci-dessous |

### La limite honnête à assumer devant un jury

Le `localStorage` est **lisible par tout JavaScript de la page**. Une faille XSS
permettrait donc de voler le token. La parade la plus robuste serait un cookie
`httpOnly` + `Secure` + `SameSite`, invisible pour JavaScript.

Ce que le projet fait quand même bien :
- **Aucune injection de HTML brut** dans le React (pas de `dangerouslySetInnerHTML`)
- **`escapeHtml()`** sur toute donnée utilisateur insérée dans les emails
- **CSP stricte** (Helmet) qui interdit les scripts d'origine externe
- **Durée de vie d'une heure**, qui limite la fenêtre d'exploitation

Dire « j'ai choisi le comportement par défaut de Supabase, j'en connais la limite, et
voici comment je la compenserais » vaut bien mieux que de prétendre qu'il n'y a pas de
compromis.

---

## 8. Les questions probables du jury

**« Où est stocké le token ? »**
Dans le `localStorage` du navigateur, sous la clé `sb-<ref-projet>-auth-token`, écrite par
la librairie Supabase. Côté serveur : nulle part, l'API est sans état.

**« Le JWT est-il chiffré ? »**
Non, seulement encodé en base64. Il est **signé**, ce qui garantit qu'on ne peut pas le
modifier — pas qu'on ne peut pas le lire. D'où la règle : rien de confidentiel dedans.

**« Que se passe-t-il au bout d'une heure ? »**
La librairie utilise le `refresh_token` pour en obtenir un nouveau, automatiquement.
L'utilisateur ne voit rien. C'est pour ça que le code appelle `getSession()` avant chaque
requête au lieu de mémoriser le token.

**« Comment empêchez-vous quelqu'un de se déclarer admin ? »**
Le rôle est lu dans `app_metadata`, que seule la clé `service_role` peut écrire — et elle
ne quitte jamais le serveur. Le rôle affiché côté React (`profiles.role`) ne sert qu'à
montrer ou masquer des liens : il n'ouvre aucune porte.

**« Pourquoi vérifier le token à chaque requête, c'est coûteux non ? »**
C'est le prix d'une API sans état. En contrepartie : aucun stockage de sessions, aucune
invalidation à gérer, et un redémarrage du serveur ne déconnecte personne.

**« Qui signe le JWT ? »**
Supabase Auth, avec le secret JWT du projet. Ni le front ni le serveur Express ne
possèdent ce secret — ils délèguent la vérification à `supabase.auth.getUser()`.

---

## Pour aller plus loin

- [back/securite/](back/securite/README.md) — les middlewares, 401 vs 403
- [back/securite/entetes-http.md](back/securite/entetes-http.md) — la CSP et le `wss://` du Realtime
- [back/supabase/cles-et-rls.md](back/supabase/cles-et-rls.md) — les deux clés et la RLS
- [back/supabase/auth.md](back/supabase/auth.md) — Supabase Auth côté serveur
- [front/auth/](front/auth/README.md) — `AuthContext` et le cycle de session
- [front/auth/protected-route.md](front/auth/protected-route.md) — le garde-barrière côté React
