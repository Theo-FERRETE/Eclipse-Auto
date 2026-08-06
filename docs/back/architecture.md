← [Back](README.md)

# Architecture — les 4 couches

## Le principe : 4 couches, toujours dans le même ordre

C'est **la** chose à comprendre. Chaque couche ne connaît que la suivante.

```text
Requête HTTP
    ↓
routes/      → déclare l'URL et branche le middleware d'autorisation
    ↓
middleware/  → auth.js vérifie le token, remplit req.user, ou répond 401/403
    ↓
controllers/ → valide le body/query, applique les règles métier, choisit le code HTTP
    ↓
models/      → exécute la requête Supabase et retourne { data, error }
    ↓
Supabase (PostgreSQL)
```

**Pourquoi séparer ?** Pour qu'un contrôleur puisse être lu sans savoir écrire du SQL,
et pour que les tests puissent remplacer entièrement la couche `models` par un mock
(`server/__tests__/mocks/supabase.js`) sans toucher au reste.

**Règle de lecture** : pour comprendre n'importe quelle fonctionnalité, tu pars du fichier
dans `routes/`, tu lis le nom du contrôleur, tu ouvres le contrôleur, puis le modèle.
Trois fichiers, jamais plus.

## Exemple complet : « le client annule sa réservation »

| Étape | Fichier | Ce qui se passe |
|---|---|---|
| 1 | `routes/reservations.js` | `router.patch('/:id/cancel', requireAuth, reservationController.cancel)` |
| 2 | `middleware/auth.js` | Lit `Authorization: Bearer <token>`, appelle `supabase.auth.getUser(token)`. Si le token est invalide → **401**. Sinon `req.user` est rempli. |
| 3 | `controllers/reservationController.js` → `cancel` | Charge la réservation (`client_id`, `status`). Si elle n'existe pas → **404**. Si `client_id !== req.user.id` → **403**. Si le statut n'est ni `pending` ni `confirmed` → **400**. |
| 4 | `models/reservationModel.js` → `cancel` | `update({ status: 'cancelled' })` sur la ligne |
| 5 | PostgreSQL | Un **trigger** repasse le véhicule en `available` |
| 6 | retour | `res.json(data)` → **200** avec la réservation à jour |

Le contrôle du point 3 est le cœur de la sécurité : sans lui, n'importe quel utilisateur
connecté pourrait annuler la réservation de quelqu'un d'autre en devinant un UUID.

## Les 6 familles de routes

| Préfixe | Fichier | Protection |
|---|---|---|
| `/api/vehicles` | `routes/vehicles.js` | GET public · POST/PUT/DELETE `requireAdmin` |
| `/api/reservations` | `routes/reservations.js` | tout protégé · `/all` et `/:id/status` en `requireAdmin` |
| `/api/admin` | `routes/admin.js` | tout en `requireAdmin` |
| `/api/equipements` | `routes/equipements.js` | GET public · écritures `requireAdmin` |
| `/api/contact` | `routes/contact.js` | public, mais **rate-limité** (5 req / 15 min / IP) |
| `/api/health` | `routes/health.js` | public — sert à vérifier que l'API répond |

Le détail de chaque route (body attendu, réponses, codes d'erreur) est dans
[../ENDPOINTS.md](../ENDPOINTS.md).

## Ce que fait `app.js`, dans l'ordre

1. **Helmet + CSP personnalisée** — en-têtes de sécurité. La CSP est construite par
   `buildCspDirectives()` pour autoriser explicitement l'origine Supabase en `connect-src`
   et `img-src`. Sans ça, en production, **tous** les appels du navigateur vers Supabase
   sont bloqués (voir [securite.md](securite.md#la-csp-content-security-policy--le-piège-de-production)).
2. **`setupMiddleware(app)`** — compression gzip, CORS limité à `CLIENT_URL`, logs morgan,
   parsing du JSON.
3. **`app.use('/api', apiRouter)`** — les routes de l'API.
4. **404 JSON pour `/api/*` inconnu** — sinon une URL d'API mal orthographiée renverrait
   le HTML du site, très pénible à déboguer.
5. **Fichiers statiques** — en production, Express sert le build React (`client/dist`)
   avec un cache d'un an, et renvoie `index.html` pour toute autre URL (c'est ce qui fait
   marcher les URLs du routeur React en accès direct).
6. **Gestionnaire d'erreurs global** — en production, le message d'erreur réel est masqué
   et remplacé par « Erreur interne du serveur. », pour ne pas fuiter d'infos techniques.

`app.js` exporte l'application **sans appeler `listen()`** : c'est ce qui permet aux tests
Supertest de l'utiliser directement, sans ouvrir de port.

## Variables d'environnement

`index.js` refuse de démarrer si l'une de ces variables manque (`process.exit(1)`) :

| Variable | Rôle |
|---|---|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin — **jamais** exposée au navigateur |
| `GMAIL_USER` | Compte Gmail émetteur des emails |
| `GMAIL_APP_PASSWORD` | Mot de passe d'application Gmail (pas le mot de passe du compte) |

Optionnelles : `PORT` (défaut 3001), `CLIENT_URL` (origine CORS autorisée),
`NODE_ENV`, `TRUST_PROXY`.

Échouer au démarrage plutôt qu'au premier appel est volontaire : une variable oubliée
se voit immédiatement, pas trois écrans plus loin. Le code de sortie `1` permet en plus à
un gestionnaire de processus de voir que le service n'a pas démarré.

## Commandes

```bash
cd server
npm run dev     # node --watch index.js
npm start       # node index.js
npm test        # jest --coverage
```
