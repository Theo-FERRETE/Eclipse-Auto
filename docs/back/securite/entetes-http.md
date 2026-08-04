← [Sécurité](README.md)

# En-têtes HTTP et protections d'infrastructure

## La CSP (Content Security Policy) — le piège de production

Helmet ajoute des en-têtes de sécurité HTTP. Sa CSP par défaut n'autorise que `'self'` :
le navigateur refuse alors toute requête vers un autre domaine — donc **tous** les appels
vers Supabase (REST, Auth, Realtime, Storage).

Ce bug est particulièrement vicieux parce qu'il est **invisible en développement** : Vite
sert le front sur le port 5173 sans passer par Helmet. Il n'apparaît qu'en production,
quand Express sert le build.

La correction est `buildCspDirectives()` dans `server/app.js` : elle part des directives
par défaut d'Helmet et ajoute explicitement l'origine Supabase.

```text
connect-src : 'self' + https://<projet>.supabase.co + wss://<projet>.supabase.co
img-src     : 'self' + data: + https://<projet>.supabase.co
```

Le `wss:` est indispensable pour le Realtime, qui utilise un WebSocket et non du HTTP.
Si `SUPABASE_URL` est absente ou invalide, la fonction n'échoue pas : elle logue un
avertissement et garde `'self'`.

## Le reste des protections

| Mesure | Où | Pourquoi |
|---|---|---|
| **CORS restreint** | `middleware/setup.js` | Seule l'origine `CLIENT_URL` peut appeler l'API depuis un navigateur |
| **Messages d'erreur masqués** | `app.js` (handler global) | En production, l'erreur réelle est remplacée par « Erreur interne du serveur. » — pas de fuite de structure interne ou de version |
| **404 JSON sur `/api/*`** | `app.js` | Une URL d'API inconnue renvoie du JSON, pas le HTML du site |
| **`trust proxy` conditionnel** | `app.js` | Activé seulement si `TRUST_PROXY=1`. Sinon `req.ip` serait pilotable via l'en-tête `X-Forwarded-For` et n'importe qui contournerait le rate limiting |
| **Rate limiting** | `contactController.js` | 5 requêtes / 15 min / IP sur le formulaire de contact — voir [../emails/rate-limiting.md](../emails/rate-limiting.md) |
| **Secrets hors du dépôt** | `.gitignore` | `server/.env` n'est pas versionné. Seul `.env.test` (valeurs factices) est commité |

## Ce qui reste à faire

**Activer la RLS** sur les tables pour le rôle `authenticated`. Aujourd'hui la sécurité
repose entièrement sur la couche Express. C'est cohérent — plus rien de sensible ne passe
en direct par le navigateur — mais la RLS ajouterait une seconde barrière au niveau de la
base elle-même. Voir [../supabase/cles-et-rls.md](../supabase/cles-et-rls.md).
