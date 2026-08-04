← [Architecture](README.md)

# Démarrage et configuration

## Ce que fait `app.js`, dans l'ordre

1. **Helmet + CSP personnalisée** — en-têtes de sécurité. La CSP est construite par
   `buildCspDirectives()` pour autoriser explicitement l'origine Supabase en `connect-src`
   et `img-src`. Sans ça, en production, **tous** les appels du navigateur vers Supabase
   sont bloqués (voir [../securite/entetes-http.md](../securite/entetes-http.md)).
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
