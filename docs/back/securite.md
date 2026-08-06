← [Back](README.md)

# Back : authentification et sécurité

Voir aussi [JWT.md](JWT.md) pour le jeton lui-même, et
[supabase.md](supabase.md#les-deux-clés-et-la-rls) pour les clés et la RLS.

## Le principe général

Le serveur **n'a pas de session**. Il ne stocke rien entre deux requêtes, pas de cookie de
connexion, pas de mémoire de qui est en ligne. Chaque requête protégée doit porter elle-même
sa preuve d'identité : un **JWT** émis par Supabase Auth, dans l'en-tête HTTP.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

C'est ce qu'on appelle une API *stateless*. Avantage : n'importe quelle instance du serveur
peut traiter n'importe quelle requête, et un redémarrage ne déconnecte personne.

## Les deux middlewares : `server/middleware/auth.js`

Le fichier fait une cinquantaine de lignes et contient toute l'autorisation du projet.

```text
getTokenFromHeader(req)   Extrait le token après "Bearer ". Retourne null si l'en-tête
                          est absent ou mal formé.

verifyToken(token)        Appelle supabase.auth.getUser(token).
                          Supabase vérifie la signature et l'expiration, puis renvoie
                          l'utilisateur. Retourne { user } ou { error }.

requireAuth               Token valide obligatoire. Sinon → 401.
                          Puis remplit req.user et passe la main.

requireAdmin              Idem, PLUS : user.app_metadata.role === 'admin'.
                          Sinon → 403.
```

### La distinction 401 / 403, question classique du jury

- **401 Unauthorized** = « je ne sais pas qui tu es » (token absent, invalide ou expiré)
- **403 Forbidden** = « je sais qui tu es, et tu n'as pas le droit » (connecté mais pas admin)

### Le point subtil : `app_metadata` et non `user_metadata`

Le rôle admin est lu dans `user.app_metadata.role`. Ce n'est pas un détail :

| Champ | Modifiable par l'utilisateur ? |
|---|---|
| `user_metadata` | **Oui** : via `supabase.auth.updateUser()` depuis le navigateur |
| `app_metadata` | **Non** : seul le back-office Supabase ou la clé `service_role` peut l'écrire |

Si le rôle était stocké dans `user_metadata`, n'importe quel utilisateur connecté pourrait
se promouvoir administrateur en une ligne de JavaScript dans sa console.

### Attention : deux notions de « admin » cohabitent

| Où | Source | À quoi ça sert |
|---|---|---|
| **Serveur** : `middleware/auth.js` | `user.app_metadata.role` (dans le JWT signé) | **La vraie autorisation.** Fait foi. |
| **Front** : `AuthContext` | `profiles.role` (une colonne de table) | Seulement afficher ou masquer des liens et des pages |

Le front peut se tromper ou être contourné, ce n'est que de l'affichage. Même si quelqu'un
forçait `profile.role = 'admin'` dans son navigateur pour faire apparaître le menu admin,
chaque appel à `/api/admin/*` serait rejeté en 403 par le serveur.

**Formule à retenir pour l'oral** : *le front décide ce qu'on voit, le serveur décide ce
qu'on peut faire.*

---

## Les contrôles métier

Être authentifié ne suffit pas, il faut aussi vérifier qu'on agit sur **ses propres**
données. Ces contrôles sont dans les contrôleurs, pas dans les middlewares, parce qu'ils
dépendent de la donnée concernée.

| Endroit | Contrôle |
|---|---|
| `reservationController.cancel` | `reservation.client_id !== req.user.id` → **403**. Empêche d'annuler la réservation d'un autre. |
| `reservationController.create` | `client_id: req.user.id` : le client est **forcé depuis le token**, jamais lu dans le body. Impossible de réserver au nom de quelqu'un d'autre. |
| `reservationController.listMine` | Filtre sur `req.user.id` : on ne peut lire que ses propres réservations. |
| `reservationController.cancel` | Statut autorisé uniquement `pending` ou `confirmed` : pas de ré-annulation. |
| `reservationController.create` | Le véhicule doit être `available`, sinon **409 Conflict**. |

## Validation des entrées

Rien de ce qui vient du client n'est écrit tel quel en base.

**Véhicules** (`vehicleController.validateVehicleInput`) : année entre 1900 et l'année
suivante, prix ≥ 0, kilométrage ≥ 0, statut dans la liste autorisée de `constants.js`.

**Le mécanisme `VEHICLE_FIELDS` / `buildVehiclePayload`** mérite une mention à l'oral :
le payload d'un `PUT` n'est construit **qu'avec les champs réellement envoyés**. Sans ça,
une modification partielle écraserait les autres colonnes avec `NaN` (`parseInt(undefined)`),
sérialisé en `null` par Supabase. C'est un bug silencieux évité par construction.

**Équipements** : nom obligatoire et non vide, `prix_supplement` ≥ 0.

**Contact** : nom/email/message obligatoires, format d'email vérifié par regex, nom ≤ 100
caractères, message ≤ 5 000. Et surtout : `/[\r\n]/.test(email)` rejette les retours à la
ligne dans l'adresse, c'est une protection contre l'**injection d'en-têtes SMTP**, où un
attaquant glisserait un `\nBcc: ...` pour transformer ton formulaire en relais de spam.

**Pagination** : partout, `limit` est plafonné à 100 (`Math.min(parseInt(limit) || 50, 100)`)
et `offset` ne peut pas être négatif. Sans le plafond, `?limit=999999` permettrait de vider
la base en une requête.

## Échappement HTML dans les emails

`escapeHtml()` (`server/lib/emailTemplates.js`) remplace `& < > " '` par leurs entités
avant toute insertion dans du HTML. Les emails contiennent des données saisies par
l'utilisateur (nom, message) : sans échappement, un message contenant `<script>` ou une
balise `<img onerror=...>` serait injecté tel quel dans l'email reçu. C'est du **XSS**,
simplement transposé dans un client mail.

---

## La CSP (Content Security Policy) : le piège de production

Helmet ajoute des en-têtes de sécurité HTTP. Sa CSP par défaut n'autorise que `'self'` :
le navigateur refuse alors toute requête vers un autre domaine, donc **tous** les appels
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
| **Messages d'erreur masqués** | `app.js` (handler global) | En production, l'erreur réelle est remplacée par « Erreur interne du serveur. », pas de fuite de structure interne ou de version |
| **404 JSON sur `/api/*`** | `app.js` | Une URL d'API inconnue renvoie du JSON, pas le HTML du site |
| **`trust proxy` conditionnel** | `app.js` | Activé seulement si `TRUST_PROXY=1`. Sinon `req.ip` serait pilotable via l'en-tête `X-Forwarded-For` et n'importe qui contournerait le rate limiting |
| **Rate limiting** | `contactController.js` | 5 requêtes / 15 min / IP sur le formulaire de contact, voir [emails.md](emails.md#le-rate-limiting-du-formulaire-de-contact) |
| **Secrets hors du dépôt** | `.gitignore` | `server/.env` n'est pas versionné. Seul `.env.test` (valeurs factices) est commité |

## Ce qui reste à faire

**Activer la RLS** sur les tables pour le rôle `authenticated`. Aujourd'hui la sécurité
repose entièrement sur la couche Express. C'est cohérent, plus rien de sensible ne passe
en direct par le navigateur, mais la RLS ajouterait une seconde barrière au niveau de la
base elle-même. Voir [supabase.md](supabase.md#les-deux-clés-et-la-rls).
