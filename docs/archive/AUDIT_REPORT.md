# Rapport d'Audit : Eclipse Auto v2

**Date :** 30 juillet 2026 | **Version :** 7.1 (correctifs appliqués)

> Méthode v7 : contrairement aux versions précédentes, chaque constat a été **vérifié par exécution** (tests lancés, serveur démarré en `NODE_ENV=production` et en-têtes inspectés, payloads Supabase capturés, base interrogée avec la clé anon). Les constats non vérifiables depuis le repo sont marqués **[À VÉRIFIER]**.
>
> La v7.0 constatait, la v7.1 corrige : les correctifs ont été appliqués le 30 juillet dans la même session. Chaque problème ci-dessous porte son état, corrigé, action requise de ta part, ou laissé volontairement.

---

## Notes

| Catégorie | v6 (7 juillet) | v7.0 (constat) | v7.1 (après correctifs) |
| ----------- | -------------- | -------------- | ----------------------- |
| **Sécurité** | 9/10 | 6.5/10 | 8.5/10 |
| **Architecture** | 8.5/10 | 7/10 | 9/10 |
| **Performance** | 8.5/10 | 8/10 | 8.5/10 |
| **Code Quality** | 8/10 | 7.5/10 | 8.5/10 |
| **Tests** | 9/10 | 7.5/10 | 8.5/10 |
| **Documentation** | 7/10 | 7/10 | 7.5/10 |
| **DevOps** | 8.5/10 | 6/10 | 8/10 |
| **UX/Frontend** | 8/10 | 7/10 | 8/10 |
| **Base de Données** | 6/10 | 6/10 | 6/10 |
| **Gestion d'Erreurs** | 8/10 | 6.5/10 | 8.5/10 |

### Moyenne v6 : 8.1 → constat v7.0 : 6.9 → **après correctifs : 8.1 / 10**

Deux précisions sur ces chiffres, pour ne pas se raconter d'histoires :

- **La chute de 8.1 à 6.9 entre v6 et v7.0 ne traduisait aucune régression du code** : presque rien n'avait changé depuis le 7 juillet. Elle traduisait le passage d'une notation sur lecture à une notation sur exécution. Les problèmes existaient déjà en v6 et n'avaient pas été détectés.
- **Revenir à 8.1 après correctifs n'est pas un score identique à celui de v6.** Le 8.1 de v6 était un 8.1 mesuré à la lecture, avec deux bugs bloquants dedans. Le 8.1 de v7.1 est mesuré à l'exécution, sans eux. À méthode constante, le projet a réellement progressé, c'est juste que la v6 partait d'un chiffre trop généreux.

**Base de Données reste à 6/10** : c'est le seul axe où rien n'a bougé, et volontairement (aucune DDL exécutée sur ta base sans ton accord). Voir points 4, 9 et 10.

---

## Correctifs appliqués le 30 juillet

27 fichiers modifiés, 1 ajouté. Vérifications finales, toutes exécutées :

| Contrôle | Avant | Après |
| -------- | ----- | ----- |
| Tests serveur | 57 (7 suites) | **65 (8 suites)** |
| Tests client | 37 | 37 |
| Couverture serveur (statements) | 91.8% | **92.75%**, seuils verrouillés dans `jest.config.js` |
| Lint client | OK | OK |
| Build client | OK | OK |
| `npm audit` serveur (prod) | 5 vulns, 2 *high* | **0 vulnérabilité** |
| `npm audit` client | 10 vulns, 9 *high* | 7 *high*, aucune exploitable (cf. point 6) |
| Routes API mortes | 2 | **0** |
| Chunk d'entrée JS | 240 kB | **18 kB** |

---

## Correction du rapport v6

Le rapport v6 listait en **priorité haute** : *« Credentials dans git history, non résolu, irréversible / server/.env, contenu commité dans des commits anciens / Action requise : changer les clés Supabase + Gmail AVANT tout déploiement public »*.

**C'est faux.** Vérification sur les 66 commits de l'historique :

```bash
git log --all --pretty=format: --name-only --diff-filter=A | sort -u | grep -iE "env|secret|key"
# → client/.env.example, server/.env.example, server/.env.test  (aucun .env réel)

git grep -I -l "eyJhbGciOi" $(git rev-list --all)
# → aucun résultat (aucune clé JWT Supabase dans l'historique)
```

- `server/.env` n'a **jamais** été commité (`.gitignore` le couvre depuis le début).
- `server/.env.test`, lui, a bien été commité (puis retiré au commit `c7d963b`) : mais il ne contenait que des valeurs factices : `SUPABASE_SERVICE_ROLE_KEY=test-key-123`, `GMAIL_APP_PASSWORD=test-password`.
- `server/.env.example` ne contient que des placeholders (`your_service_role_key_here`).

**Aucune rotation de clés n'est nécessaire.** Ce point est à retirer de la préparation orale : affirmer au jury qu'on a fuité des credentials alors que ce n'est pas le cas est un faux aveu qui ouvre une ligne de questions inutile.

Seul résidu réel, très mineur : `server/.env.example:4` contient l'URL réelle du projet (`https://yksnqtdppbeultmxkagq.supabase.co`). Ce n'est pas un secret, cette URL est de toute façon publique dans le bundle client, mais autant y mettre `https://your-project.supabase.co` par cohérence avec `client/.env.example`.

---

## Problèmes critiques

### 1. [CORRIGÉ] : La CSP d'Helmet cassait l'application en production

**Vérifié par exécution.** Serveur démarré en `NODE_ENV=production`, en-têtes réels sur `/api/health` :

```text
content-security-policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;
  form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';
  script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';
  upgrade-insecure-requests
```

`helmet()` est appelé sans configuration ([server/app.js:11](../../server/app.js#L11)) et applique donc sa CSP par défaut. Il **n'y a pas de directive `connect-src`**, qui retombe donc sur `default-src 'self'`.

Conséquence en production (où Express sert `client/dist` : [server/app.js:17-21](../../server/app.js#L17-L21)) : **toutes** les requêtes du navigateur vers `https://yksnqtdppbeultmxkagq.supabase.co` sont bloquées par le navigateur. Or l'application en dépend pour :

- l'authentification (`supabase.auth.signInWithPassword` : [client/src/lib/auth.js:4](../../client/src/lib/auth.js#L4)) → **connexion impossible**
- le chargement du catalogue (`supabase.from('vehicles')` : [client/src/lib/vehiclesCache.js:9-12](../../client/src/lib/vehiclesCache.js#L9-L12)) → **catalogue vide**
- le WebSocket Realtime (`wss://...`) : [client/src/pages/Catalogue/Catalogue.jsx:33-39](../../client/src/pages/Catalogue/Catalogue.jsx#L33-L39)
- les lectures de `reservations` et `profiles` des dashboards

**Pourquoi ça n'a jamais été vu :** en développement, le frontend est servi par Vite (port 5173) et ne passe pas par Helmet. Le bug n'existe que dans le mode de déploiement décrit dans le README. Les 57 tests serveur interrogent l'API en HTTP direct, sans navigateur, donc aucun n'exerce la CSP.

**Correctif** dans [server/app.js:11](../../server/app.js#L11) :

```javascript
const SUPABASE_ORIGIN = new URL(process.env.SUPABASE_URL).origin

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'connect-src': ["'self'", SUPABASE_ORIGIN, SUPABASE_ORIGIN.replace('https://', 'wss://')],
      'img-src': ["'self'", 'data:', SUPABASE_ORIGIN],
    },
  },
}))
```

`img-src` est ajouté par anticipation : aujourd'hui toutes les images sont locales (`/img/*.webp`) donc non concernées, mais `optimizeImageUrl()` gère déjà les URLs Supabase Storage ([client/src/lib/utils.js:13-18](../../client/src/lib/utils.js#L13-L18)) et la première image uploadée en Storage serait bloquée.

**Appliqué** dans [server/app.js](../../server/app.js) via `buildCspDirectives()`, qui dérive l'origine de `SUPABASE_URL` et retombe proprement sur `'self'` avec un avertissement si la variable est absente. Verrouillé par un test dans [server/\_\_tests\_\_/integration/app.test.js](../../server/__tests__/integration/app.test.js) qui vérifie la présence de l'origine Supabase dans `connect-src`.

### 2. [CORRIGÉ] : La relation many-to-many équipements n'était affichée nulle part

C'est la démonstration du CP6 mise en avant dans le résumé jury du rapport v6. Elle est **invisible dans l'interface**, dans l'espace client comme dans l'admin.

Les deux pages affichent les équipements sous condition `r.equipements?.length > 0` :

- [client/src/components/DashboardReservations/DashboardReservations.jsx:54-56](../../client/src/components/DashboardReservations/DashboardReservations.jsx#L54-L56)
- [client/src/pages/admin/AdminReservations/AdminReservations.jsx:136-140](../../client/src/pages/admin/AdminReservations/AdminReservations.jsx#L136-L140)

Mais aucune des deux ne charge ce champ, parce que toutes deux contournent l'API et interrogent Supabase directement avec un `select` qui omet la table de jointure :

```javascript
// Dashboard.jsx:22-26 et AdminReservations.jsx:19-22 - identique dans les deux
.select('*, vehicles(brand, model, images, price)')   // ← pas de reservation_equipements
```

`r.equipements` est donc toujours `undefined` : **les deux branches sont mortes**.

L'ironie est que le backend fait le travail correctement. `formatReservationEquipements()` ([server/controllers/reservationController.js:14-17](../../server/controllers/reservationController.js#L14-L17)) aplatit proprement la jointure, et `reservationModel` sélectionne bien `reservation_equipements(equipements(id, nom, prix_supplement))`. Mais :

```bash
grep -rn "reservations/all" client/src
# → aucun résultat
```

**`GET /api/reservations` et `GET /api/reservations/all` ne sont jamais appelés par le client.** Ce sont deux routes développées, documentées dans le README, couvertes par les tests d'intégration... et mortes en pratique.

**Correctif** : remplacer les lectures Supabase directes par l'API existante. Dans [client/src/pages/Dashboard/Dashboard.jsx:22-26](../../client/src/pages/Dashboard/Dashboard.jsx#L22-L26) :

```javascript
const { data: { session } } = await supabase.auth.getSession()
const res = await fetch('/api/reservations', {
  headers: { Authorization: `Bearer ${session?.access_token}` },
})
if (res.ok) setReservations(await res.json())
```

Et dans `AdminReservations.fetchReservations()`, `GET /api/reservations/all` : qui renvoie déjà les équipements formatés. Ce changement résout d'un coup trois choses : la fonctionnalité redevient visible, les deux routes mortes reprennent du sens, et les lectures cessent de dépendre de la configuration RLS (point 4).

**Appliqué.** Les deux pages passent désormais par l'API ([Dashboard.jsx](../../client/src/pages/Dashboard/Dashboard.jsx), [AdminReservations.jsx](../../client/src/pages/admin/AdminReservations/AdminReservations.jsx)) : les équipements s'affichent, et les deux routes mortes sont utilisées.

**Détail rencontré en route, qui vaut d'être connu pour l'oral.** Je voulais ajouter la jointure `profiles(first_name, last_name)` dans `reservationModel.findAll()` pour récupérer le nom du client côté API. PostgREST l'a refusée :

```json
{"code":"PGRST200","details":"Searched for a foreign key relationship between
'reservations' and 'profiles' in the schema 'public', but no matches were found."}
```

**Il n'existe aucune clé étrangère `reservations.client_id → profiles.id`** dans ton schéma, `client_id` référence `auth.users`, pas `profiles`. PostgREST ne sait embarquer une table liée que s'il trouve une FK déclarée. C'est précisément pour ça que l'ancien code faisait deux requêtes.

La logique de résolution des noms a donc été déplacée du client vers le contrôleur (`withClientNames()` dans [reservationController.js](../../server/controllers/reservationController.js), + `findProfilesByIds()` dans le modèle) : même approche en deux requêtes, mais côté serveur, où elle appartient. `client_name` fait maintenant partie du contrat de l'API.

Si tu ajoutes un jour la FK (`alter table reservations add constraint ... foreign key (client_id) references profiles(id)`), la jointure devient possible et les deux requêtes se réduisent à une. C'est une bonne réponse à « comment optimiserais-tu ? ».

---

## Problèmes de priorité haute

### 3. [CORRIGÉ] : Perte de données sur `PUT /api/vehicles/:id` partiel

**Vérifié par capture du payload** envoyé au modèle. Requête `PUT` avec le corps `{ "status": "sold" }` :

```text
payload transmis à Supabase →
{"year":null,"price":null,"mileage":0,"power":null,"description":null,"status":"sold","images":[]}
```

L'année, le prix, le kilométrage, la puissance, la description et les images du véhicule sont **écrasés**.

Cause : `update` ne vérifie aucun champ obligatoire, contrairement à `create` ([server/controllers/vehicleController.js:81-83](../../server/controllers/vehicleController.js#L81-L83) fait ce contrôle, [vehicleController.js:105-121](../../server/controllers/vehicleController.js#L105-L121) ne le fait pas). `parseInt(undefined)` vaut `NaN`, et `JSON.stringify(NaN)` produit `null` : la valeur part donc en base. `validateVehicleInput` ne rattrape rien : ses gardes `if (year)` laissent passer `undefined`.

`brand`, `model`, `fuel_type` et `transmission` sont épargnés (restés `undefined`, ils sont retirés du JSON), ce qui rend le bug d'autant plus sournois : la fiche garde son titre mais perd son prix et ses photos.

L'interface actuelle ne le déclenche pas, `AdminVehicles` envoie toujours l'objet complet (`{...vehicle, status}` : [AdminVehicles.jsx:120](../../client/src/pages/admin/AdminVehicles/AdminVehicles.jsx#L120)). Le contrat d'API est néanmoins cassé pour tout autre appelant, et un `PUT` est précisément le verbe qu'un correcteur testera avec un corps minimal.

**Appliqué** : `buildVehiclePayload()` ne construit le payload qu'avec les clés réellement présentes dans `req.body`, et `update` refuse un corps vide (400). `create` et `update` partagent désormais la même construction, ce qui supprime la duplication des onze champs. Bonus : `validateVehicleInput` valide maintenant `status` contre `VEHICLE_STATUSES` : la constante était importée mais ne servait qu'au filtrage des requêtes GET, donc `POST`/`PUT` acceptaient n'importe quelle chaîne.

Trois tests ajoutés dans [vehicles.test.js](../../server/__tests__/integration/vehicles.test.js) : le PUT partiel n'envoie que `status`, le corps vide donne 400, le statut invalide donne 400.

### 4. [ACTION REQUISE] : La sécurité des lectures reposait sur une RLS non documentée

Le repo ne contient **aucune policy Postgres** (aucun `.sql`, aucun `CREATE POLICY`). Or le client lit `reservations` et `profiles` directement avec la clé anon, publique par nature puisque présente dans le bundle JS.

Ce que j'ai pu vérifier depuis l'extérieur, clé anon, **sans authentification** :

| Table | Réponse | Interprétation |
| ----- | ------- | -------------- |
| `vehicles` | `200` + données | Lecture publique, voulu |
| `profiles` | `200 []` | `GRANT` présent mais RLS filtre tout, **correct** |
| `reservations` | `401 permission denied` | Aucun `GRANT` au rôle `anon` : **correct** |
| `equipements` | `401 permission denied` | Aucun `GRANT` au rôle `anon` |
| `reservation_equipements` | `401 permission denied` | Aucun `GRANT` au rôle `anon` |

Le rôle anonyme est donc bien cloisonné. **Mais le rôle qui compte n'a pas pu être testé** : je n'ai pas de compte de test, et je n'en ai pas créé pour ne pas polluer ta base réelle.

Le risque précis : dans Supabase, un client et un admin portent **tous les deux** le rôle Postgres `authenticated` (le rôle applicatif vit dans `app_metadata.role`, pas dans le JWT Postgres). Or `AdminReservations` fait un `select('*')` **sans filtre** sur `reservations` et l'admin y voit bien toutes les lignes. Deux configurations produisent ce résultat :

- **Sûre** : une policy du type `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR client_id = auth.uid()`.
- **Vulnérable** : RLS désactivée ou policy permissive sur `authenticated`. Dans ce cas **n'importe quel client connecté peut lire toutes les réservations et tous les profils** (nom, prénom, téléphone de tous les clients) avec la clé anon publique. Le filtre `.eq('client_id', user.id)` de [Dashboard.jsx:25](../../client/src/pages/Dashboard/Dashboard.jsx#L25) ne protège rien : il est côté client, donc modifiable dans la console du navigateur.

**À exécuter dans le SQL Editor de Supabase pour trancher :**

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';

select tablename, policyname, roles, cmd, qual
from pg_policies where schemaname = 'public' order by tablename;
```

**Le risque est déjà neutralisé structurellement** par le correctif du point 2 : plus aucune lecture sensible ne passe par la clé anon. Après vérification (`grep`), les seuls appels Supabase directs restants côté client sont `supabase.auth.*` (connexion, session, mot de passe, légitime, c'est le rôle du SDK), la lecture de `vehicles` (données publiques) et l'`update` de son propre profil.

**Il reste deux choses à faire de ton côté**, que je n'ai pas faites délibérément, exécuter de la DDL sur ta base de production sans ton accord n'est pas à moi de le décider :

1. Lancer le SQL ci-dessus et regarder le résultat. C'est du diagnostic, cinq secondes.
2. Si `rowsecurity` vaut `false` sur `reservations` ou `profiles`, activer RLS et écrire les policies. À faire même maintenant que l'Express filtre tout : c'est de la défense en profondeur, et le jury peut poser la question.

C'est un argument fort à présenter : *« la clé publique ne donne accès qu'aux données publiques, et la RLS est la seconde barrière si jamais une requête directe réapparaissait. »*

### 5. [CORRIGÉ] : Le rate limiting du formulaire de contact était contournable

[server/app.js:10](../../server/app.js#L10) fait `app.set('trust proxy', 1)`, ce qui indique à Express de faire confiance à l'en-tête `X-Forwarded-For` pour calculer `req.ip`. Or [server/controllers/contactController.js:51](../../server/controllers/contactController.js#L51) utilise exactement `req.ip` comme clé de limitation.

Si le serveur n'est pas réellement derrière un proxy inverse qui réécrit cet en-tête, n'importe qui peut envoyer une valeur arbitraire à chaque requête et disposer d'un compteur neuf à chaque fois, la limite de 5 messages / 15 min tombe. L'impact concret : envoi illimité de mails via ton compte Gmail, jusqu'au blocage du compte par Google pour abus.

**Correctif** : ne mettre `trust proxy` que si un proxy est réellement présent (`app.set('trust proxy', process.env.TRUST_PROXY === '1')`), et documenter la variable. Passer à `express-rate-limit` réglerait aussi le point au passage, le paquet gère la validation de `trust proxy` et refuse de démarrer dans une configuration ambiguë.

Deux défauts secondaires sur le même mécanisme : la `Map` ([contactController.js:11](../../server/controllers/contactController.js#L11)) n'est jamais purgée des IP expirées (croissance mémoire non bornée), et elle est réinitialisée à chaque redémarrage (déjà noté en v6).

**Appliqué** : `trust proxy` n'est activé que si `TRUST_PROXY === '1'` ([app.js](../../server/app.js)), variable documentée dans `.env.example` et le README. `purgeExpired()` nettoie la `Map` à chaque appel. La réinitialisation au redémarrage reste (acceptée : un stockage Redis serait disproportionné ici, c'est la réponse à donner si on te pose la question).

Point d'attention pour comprendre les tests : les tests du formulaire de contact **simulent** plusieurs IP via `X-Forwarded-For`, donc ils ont besoin de `trust proxy`. `TRUST_PROXY=1` a été ajouté à `.env.test` et au bloc `env` de la CI. Un test supplémentaire vérifie l'inverse, avec `TRUST_PROXY` absent, six requêtes portant six `X-Forwarded-For` différents finissent bien en 429, donc l'en-tête est ignoré.

### 6. [PARTIELLEMENT CORRIGÉ] : Dépendances vulnérables

```text
server (prod)  : 5 vulnérabilités - 1 low, 2 moderate, 2 high
client         : 10 vulnérabilités - 1 low, 9 high
```

Les plus notables :

- **`ws` 8.0.0–8.20.1, high**, présent des deux côtés : divulgation de mémoire non initialisée + déni de service par épuisement mémoire. Arrive via `@supabase/supabase-js` (Realtime), donc réellement dans le chemin d'exécution.
- **`vite` : high** : lecture de fichier arbitraire via le WebSocket du serveur de dev, contournement de `server.fs.deny`. Dev uniquement, mais exploitable sur un poste de développement exposé.
- **`qs` 6.11.1–6.15.1, moderate** : DoS déclenchable à distance.
- **`nodemailer`** : correctif disponible.

**Résultat après correctifs :**

| | Avant | Après |
| - | ----- | ----- |
| Serveur (production) | 5 vulns, 2 *high* | **0 vulnérabilité** |
| Serveur (dev inclus) |, | 19 *high*, toutes `brace-expansion` |
| Client | 10 vulns, 9 *high* | 7 *high* : `brace-expansion` + `react-router` |

Corrigé : `ws` → 8.21.1, `qs` → 6.15.3, `vite` → 8.1.5, `nodemailer` → 9.0.3, `sharp` → 0.35.3. Les trois que je signalais comme réellement dans le chemin d'exécution (`ws` via Supabase Realtime, `vite`, `qs`) sont réglés.

**Ce qui reste, et pourquoi je l'ai laissé** : c'est la partie à savoir expliquer, parce qu'un `npm audit` non vide devant le jury demande une réponse :

- **`nodemailer` ≤ 9.0.0** (*high*) : il fallait passer en 9.x, une version majeure. Fait, après vérification que l'API utilisée (`createTransport({service:'gmail'})` + `sendMail`) est inchangée. **Les tests mockent nodemailer, donc ils ne valident pas l'envoi réel** : fais un envoi de test manuel (formulaire de contact + confirmation de réservation) avant de considérer ce point clos. C'est le seul changement de cette session que la suite de tests ne couvre pas.
- **`brace-expansion` ≤ 5.0.7** (*high*, dev uniquement) : DoS par expansion de glob non bornée, à l'intérieur de Jest et Vite. `npm audit fix --force` propose de **rétrograder Jest de v30 à v25**, ce qui n'est pas un correctif. Le vrai correctif serait un `override` vers 5.0.8, mais `minimatch` attend les API v1/v2 : forcer la v5 casserait le lanceur de tests. Non exploitable ici (il faudrait fournir des patterns de glob malveillants, donc déjà contrôler la config de test). **Laissé volontairement.**
- **`react-router` ≥7.12 <8.3** (*high*) : « RSC Mode CSRF Bypass ». L'application utilise `BrowserRouter` sans RSC ni server actions (vérifié par `grep`) : **l'avis ne s'applique pas au code**. Le correctif exige React Router 8, une version majeure, à trois semaines de l'examen. **Laissé volontairement.**

La bonne réponse à « as-tu des dépendances vulnérables ? » n'est donc pas « non », c'est : *« zéro en production côté serveur. Il reste trois avis en dev ou non applicables ; j'ai vérifié chacun, je peux dire pourquoi ils ne m'exposent pas et ce que coûterait leur correction. »* C'est plus solide qu'un audit vide obtenu avec `--force`.

---

## Problèmes de priorité moyenne

### 7. [CORRIGÉ] : Les routes API inconnues renvoyaient `200` + du HTML

**Vérifié :**

```text
GET /api/route-qui-nexiste-pas
→ 200 | content-type: text/html | body: <!doctype html><html lang="fr">...
```

Le *catch-all* SPA ([server/app.js:22-24](../../server/app.js#L22-L24)) intercepte tout ce qui n'a pas été routé, y compris `/api/*`. Conséquences : une faute de frappe dans un `fetch` côté client donne `res.ok === true`, puis un `res.json()` qui explose sur `Unexpected token '<'` : une erreur qui n'a aucun rapport avec la cause. Et un client d'API reçoit une page web là où il attend du JSON.

**Correctif** : un 404 JSON pour l'API, avant le catch-all :

```javascript
app.use('/api', (req, res) => res.status(404).json({ error: 'Route introuvable.' }))
```

**Appliqué** dans [server/app.js](../../server/app.js), placé après le routeur API et avant le service des fichiers statiques. Verrouillé par un test dans [app.test.js](../../server/__tests__/integration/app.test.js) qui vérifie le code 404 *et* le `content-type: application/json`.

### 8. [CORRIGÉ] : `adminController.stats` avalait silencieusement les erreurs Supabase

[server/controllers/adminController.js:4-21](../../server/controllers/adminController.js#L4-L21) déstructure les huit résultats de `Promise.all` sans jamais regarder `error`. Si une requête échoue, `count` vaut `undefined` et la route renvoie **`200` avec des `null`**. Le dashboard admin affiche alors des KPI vides et des graphiques à zéro sans qu'aucune erreur n'apparaisse, ni à l'écran, ni dans les logs. C'est le seul contrôleur du projet qui ne teste pas `error` ; tous les autres le font.

**Appliqué** : `stats` inspecte les huit résultats et renvoie 500 avec le message de la première requête en échec. Test ajouté dans [admin.test.js](../../server/__tests__/integration/admin.test.js) : une requête en erreur donne bien 500 et non 200 avec des compteurs vides.

### 9. [NON CORRIGÉ] : `GET /api/vehicles/by-slug/:slug` charge toute la table

Déjà signalé en v6, non résolu. [server/controllers/vehicleController.js:53-64](../../server/controllers/vehicleController.js#L53-L64) charge tous les véhicules puis slugifie en JavaScript pour en retrouver un. Correctif : colonne `slug TEXT UNIQUE` indexée, alimentée par trigger, puis `.eq('slug', slug).single()`.

### 10. [NON CORRIGÉ] : Deux implémentations divergentes du slug (latent)

`toSlug()` côté client ([client/src/lib/utils.js:27-34](../../client/src/lib/utils.js#L27-L34)) et la slugification côté serveur ([vehicleController.js:56-63](../../server/controllers/vehicleController.js#L56-L63)) suivent des règles différentes : le client **supprime** les caractères non alphanumériques, le serveur les **remplace par un tiret**.

J'ai comparé les deux sur les 21 véhicules réellement en base : **0 divergence aujourd'hui**. Le problème est donc latent, pas actif. Mais il se déclenchera au premier modèle contenant un point ou une apostrophe, par exemple `Mégane R.S.` donnerait `renault-megane-rs` côté client et `renault-megane-r-s` côté serveur. Symptôme alors très déroutant : la fiche s'ouvre quand le cache est chaud (résolution locale) et renvoie 404 quand il est froid (appel API) : soit un bug qui dépend de l'ordre de navigation.

Le correctif du point 9 (slug en base) fait disparaître le problème : une seule source de vérité.

### 11. [CORRIGÉ] : Filtre « Année minimum » inopérant sur 24% du catalogue

[client/src/components/Filters/Filters.jsx:91](../../client/src/components/Filters/Filters.jsx#L91) code en dur `[2024, 2023, 2022, 2021, 2020]`. Années réellement présentes en base :

```text
{2026: 1, 2025: 4, 2024: 3, 2023: 1, 2022: 1, 2021: 3, 2020: 3, 2019: 3, 2018: 1, 2017: 1}
→ 5 véhicules sur 21 (2025 et 2026) ne peuvent pas être ciblés par le filtre
```

C'est le même type de valeur codée en dur que le `700000` supprimé en juin. Le composant reçoit déjà `vehicles` en amont : la liste doit être dérivée des données, comme le sont déjà `brands`, `fuelTypes` et `transmissions` ([Catalogue.jsx:57-67](../../client/src/pages/Catalogue/Catalogue.jsx#L57-L67)).

**Appliqué** : `years` est calculé dans `Catalogue` avec un `useMemo` (tri décroissant, doublons supprimés) et passé en prop à `Filters`, exactement comme les trois autres listes. Plus aucune année codée en dur.

### 12. [CORRIGÉ] : `PATCH /api/reservations/:id/status` : 500 au lieu de 404, et constante ignorée

Deux défauts dans [server/controllers/reservationController.js:76-108](../../server/controllers/reservationController.js#L76-L108) :

- Aucun contrôle d'existence : sur un ID inconnu, le `.single()` du modèle échoue et la route renvoie **500** là où **404** est la réponse correcte. `cancel()` fait ce contrôle correctement ([reservationController.js:112-114](../../server/controllers/reservationController.js#L112-L114)) : il suffit de s'en inspirer.
- La ligne 79 code en dur `['pending', 'confirmed', 'cancelled']` alors que `RESERVATION_STATUSES` est **déjà importé** ligne 4 et utilisé ligne 33. Incohérence dans le même fichier.

**Appliqué** : contrôle d'existence renvoyant 404 (ce qui permet aussi de simplifier la condition d'envoi d'email en aval, `resData` étant désormais garanti), et usage de `RESERVATION_STATUSES`. Test 404 ajouté dans [reservations.test.js](../../server/__tests__/integration/reservations.test.js).

### 13. [PARTIELLEMENT CORRIGÉ] : La pagination serveur existe mais le client ne l'utilise pas

Les contrôleurs implémentent proprement `limit`/`offset` avec plafond à 100 (`vehicleController.list`, `reservationController.listAll`, `adminController.listClients`). Côté client, les trois listes chargent **tout** puis paginent en mémoire :

- [AdminVehicles.jsx:37-40](../../client/src/pages/admin/AdminVehicles/AdminVehicles.jsx#L37-L40) puis `.slice()` ligne 134
- [AdminReservations.jsx:19-22](../../client/src/pages/admin/AdminReservations/AdminReservations.jsx#L19-L22) puis `.slice()` ligne 69
- `Catalogue` via `vehiclesCache` puis `.slice()` ligne 95

Acceptable à 21 véhicules, et pour le catalogue c'est même un choix défendable (filtrage et tri instantanés côté client). Mais pour les deux pages admin c'est du travail fait puis jeté, et la question « et avec 5 000 véhicules ? » est très probable à l'oral. Le plafond de 100 rend d'ailleurs le comportement silencieusement incorrect au-delà de 100 lignes.

**État après correctifs** : `AdminReservations` demande maintenant explicitement `?limit=100` (constante `MAX_RESERVATIONS`), ce qui rend le plafond visible dans le code au lieu d'être implicite. La pagination reste côté client sur les trois listes, **choix assumé** à ce volume de données. La vraie pagination serveur (recharger à chaque changement de page, afficher `total` renvoyé par l'API) est un chantier de refonte des trois pages, sans bénéfice à 21 véhicules. À présenter comme tel : *« la pagination serveur existe et est testée, le front la consomme partiellement ; je bascule dessus quand le volume le justifie. »*

### 14. [DOCUMENTÉ] : Incohérence RBAC : `profiles.role` côté client, `app_metadata.role` côté serveur

Le client décide de l'accès admin sur `profile?.role === 'admin'` ([ProtectedRoute.jsx:11](../../client/src/components/ProtectedRoute/ProtectedRoute.jsx#L11), [AuthContext.jsx:51](../../client/src/lib/AuthContext.jsx#L51)), le serveur sur `user.app_metadata?.role !== 'admin'` ([middleware/auth.js:34](../../server/middleware/auth.js#L34)). Ce sont **deux sources de vérité distinctes**.

Ce n'est pas une faille, le serveur, seul décideur réel, utilise `app_metadata`, que le client ne peut pas modifier. Mais si les deux divergent, l'utilisateur obtient une interface admin dont chaque appel API répond 403 : symptôme incompréhensible côté utilisateur. À documenter, et à mentionner à l'oral comme un choix assumé (`profiles.role` pour l'affichage, `app_metadata.role` pour l'autorisation) plutôt que de se le faire pointer.

**Appliqué** : le comportement est inchangé (il est correct), mais il est désormais explicité dans la section Sécurité du README. Aucun code modifié, c'était un problème de documentation, pas de logique.

---

## Problèmes de priorité basse

Tous corrigés sauf mention contraire :

- **`escapeHtml` dupliqué** : la copie de `contactController` est supprimée, la fonction est importée depuis `lib/emailTemplates`.
- **CI non reproductible** : `npm ci` remplace `npm install` sur les deux workspaces, et le cache npm couvre maintenant les deux `package-lock.json`.
- **Pas de seuil de couverture** : `coverageThreshold` ajouté dans [jest.config.js](../../server/jest.config.js) : 90% statements / 78% branches / 95% functions / 95% lines, juste sous les valeurs actuelles. La CI échoue désormais en cas de régression.
- **`AdminEquipements.fetchEquipements` ne testait pas `res.ok`** : contrôle ajouté, avec message d'erreur affiché au lieu d'un crash de la page.
- **`Reservation.jsx` rechargeait tous les véhicules** : utilise désormais `getVehicleBySlug()` du cache partagé, comme `VehicleDetail`.
- **`server/.env.example`** : URL réelle remplacée par un placeholder, et `TRUST_PROXY` documenté.
- **Pas de lint serveur** : non fait. Nécessite une config ESLint pour CommonJS/Node depuis zéro ; à faire s'il te reste du temps, mais sans effet sur le comportement.
- **Pas de TypeScript, pas de Swagger, pas de migrations versionnées** : inchangé depuis v6, hors périmètre à trois semaines de l'examen.

### Améliorations non demandées, découvertes en route

- **Découpage du bundle rétabli et amélioré.** La montée de Vite (8.0.1 → 8.1.5) a changé l'heuristique de *chunking* : les chunks `react`, `supabase` et `utils` fusionnaient dans l'entrée, qui passait de 240 kB à 434 kB. Un `manualChunks` explicite a été ajouté dans [vite.config.js](../../client/vite.config.js) : sous forme de **fonction**, car Vite 8 utilise rolldown, qui refuse la forme objet. Résultat meilleur qu'avant l'audit :

| Chunk | Avant l'audit | Après |
| ----- | ------------- | ----- |
| Entrée (`index`) | 240 kB | **18 kB** |
| `react` | 7,5 kB (partiel) | 224 kB (isolé, cacheable) |
| `supabase` | 184 kB | 184 kB (isolé) |
| `charts` | inclus dans AdminDashboard (177 kB) | **177 kB isolé** → AdminDashboard tombe à 7,4 kB |
| **Total JS** | 675 kB | 674 kB |

  Le volume total est identique ; c'est la granularité de cache qui change. Chart.js n'est plus lié à la page qui l'utilise, et une modification du code applicatif n'invalide plus les 400 kB de dépendances dans le cache du navigateur.

## Ce que la suite de tests ne voit pas

Au moment du constat, 94 tests passaient (**vérifié** : 57 serveur / 7 suites, 37 client / 7 suites, lint propre) avec 91,8% de couverture serveur, chiffres conformes à ceux annoncés en v6. Et pourtant **aucun** des six problèmes les plus graves n'était détecté. C'est le constat le plus important de cet audit : *une couverture élevée sur du code qui n'est pas celui qui casse.*

| Problème | Pourquoi aucun test ne le voit |
| -------- | ------------------------------ |
| CSP casse la prod (1) | Les tests appellent l'API en HTTP direct ; aucun navigateur, donc aucune CSP appliquée. Aucun test ne tourne en `NODE_ENV=production`. |
| Équipements invisibles (2) | La couverture porte sur le serveur, qui est correct. Les tests client ne couvrent ni `Dashboard` ni `AdminReservations` : les deux pages fautives. |
| PUT partiel détruit des données (3) | Les tests d'intégration `vehicles` n'envoient que des corps complets. Aucun cas de `PUT` partiel. |
| RLS (4) | Supabase est mocké ([__tests__/mocks/supabase.js](../../server/__tests__/mocks/supabase.js)) : un mock n'a pas de policies. Par construction, aucun test ne peut valider une RLS. |
| Rate limit contournable (5) | Le test de rate limiting utilise une IP constante ; aucun ne fait varier `X-Forwarded-For`. |
| 404 API (7) | Aucun test ne demande une route inexistante. |

### Ce qui a été ajouté

Huit tests serveur, chacun ciblant un bug réel de ce rapport plutôt que de la ligne à couvrir, 57 → **65 tests**, couverture 91,8% → **92,75%** :

| Test | Verrouille |
| ---- | ---------- |
| `un PUT partiel n'écrase pas les champs absents du corps` | point 3 (perte de données) |
| `rejette un PUT sans aucun champ modifiable (400)` | point 3 |
| `rejette un statut de véhicule invalide (400)` | validation `VEHICLE_STATUSES` |
| `renvoie un 404 JSON sur une route /api inconnue` | point 7 |
| `autorise l'origine Supabase dans la CSP` | point 1 (régression de déploiement) |
| `ignore X-Forwarded-For quand TRUST_PROXY est désactivé` | point 5 (contournement du rate limit) |
| `retourne 404 si la réservation n'existe pas` | point 12 |
| `remonte une erreur Supabase en 500 au lieu de 200 avec des compteurs vides` | point 8 |

Chacun tient en une phrase explicable à l'oral, ce qui était ton critère lors de la réduction de juillet (168 → 93 tests). Les seuils de couverture sont maintenant verrouillés dans `jest.config.js` : la CI échoue si un futur changement fait régresser la mesure.

**Deux angles morts subsistent, par construction :**

- **La RLS reste intestable** : Supabase est mocké, et un mock n'a pas de policies. Aucun test ne pourra jamais valider une policy Postgres. C'est pour ça que le point 4 demande une vérification manuelle.
- **L'envoi réel d'emails reste intestable** : nodemailer est mocké. C'est sans conséquence d'habitude, mais cette session a monté nodemailer en version majeure (8 → 9) : fais un envoi manuel de bout en bout avant de considérer le point 6 clos.

---

## Ce qu'il reste à faire

Par ordre de priorité :

| # | Action | Effort | État |
| - | ------ | ------ | ---- |
| 1 | **Exécuter le SQL de vérification RLS** (point 4) et activer les policies si `rowsecurity = false` | 5 min + ~30 min | à toi, je n'exécute pas de DDL sur ta base |
| 2 | **Tester manuellement les deux envois d'email** (contact + confirmation de réservation) après la montée nodemailer 9 | 10 min | à toi, non couvrable par les tests |
| 3 | Colonne `slug` indexée en base (points 9 et 10 d'un coup) | ~1 h | différé |
| 4 | Messagerie client ↔ admin | ~6 h | différé, chantier de fond |
| 5 | Config ESLint serveur | ~30 min | différé, confort |

Les points 1 et 2 sont les seuls à traiter avant l'oral. Le reste est du confort.

---

## Points forts confirmés

Rien de ce qui suit n'est remis en cause par cet audit, ces éléments ont été vérifiés et tiennent :

- **Architecture backend en trois couches** route → controller → model, appliquée avec rigueur : routes purement déclaratives (14 lignes pour tout le CRUD véhicules), aucun `require('../supabase')` hors des modèles, une fonction de modèle = une requête.
- **102 tests qui passent réellement** (65 serveur + 37 client), exécutés lors de cet audit, plus lint propre et build vert. La suite était saine mais trop étroite ; sa portée couvre maintenant les régressions de déploiement et de contrat d'API.
- **Écritures correctement centralisées** : `grep` sur `client/src` ne trouve plus aucun `insert`/`delete` Supabase direct. Seul subsiste un `update` sur son propre profil ([DashboardProfile.jsx:22-29](../../client/src/components/DashboardProfile/DashboardProfile.jsx#L22-L29)). Toutes les mutations sensibles passent par Express avec JWT Bearer, et `client_id` est forcé côté serveur depuis le token ([reservationController.js:58](../../server/controllers/reservationController.js#L58)) : la faille d'usurpation est bien fermée.
- **Rôle `anon` correctement cloisonné** en base (vérifié : 401 sur `reservations`, `equipements`, `reservation_equipements` ; `profiles` filtré par RLS).
- **Toutes les lectures sensibles passent désormais par Express** : la clé anon publique ne donne plus accès qu'à `vehicles`, qui est public par nature.
- **Échappement HTML systématique** avant toute injection dans les emails, validation d'email avec protection contre l'injection d'en-tête (`/[\r\n]/`).
- **Aucun secret dans l'historique git** (66 commits vérifiés) : cf. Correction du rapport v6.
- **CI complète** sur GitHub Actions : tests serveur + tests client + lint + build à chaque push.
- **Realtime Supabase** avec patch optimiste du cache et nettoyage correct du channel au démontage.
- **Filtres entièrement dans l'URL** via `useSearchParams`, valeurs par défaut absentes de l'URL, partageable et rechargeable.
- **Découpage des composants** effectué proprement : `Catalogue` en 4 fichiers, `Dashboard` et `Reservation` en sous-composants dédiés. Aucun fichier ne dépasse 210 lignes.

---

## Questions probables du jury : mises à jour

Les réponses de la v6 restent valables, avec ces ajouts :

- *« Ton application fonctionne-t-elle en production ? »* → Réponse honnête après correctif : « J'ai découvert lors du dernier audit que la CSP par défaut d'Helmet bloquait mes appels Supabase en production, parce qu'en développement c'est Vite qui sert le front et qu'il ne passe pas par Helmet. J'ai ajouté un `connect-src` explicite et un test d'en-têtes en `NODE_ENV=production`. » C'est un excellent sujet : il montre une compréhension réelle de la CSP et de la différence dev/prod.
- *« Comment garantis-tu qu'un client ne lit pas les réservations d'un autre ? »* → « Toutes les lectures sensibles passent par Express, qui filtre sur le `client_id` extrait du JWT, pas sur un paramètre envoyé par le client. La clé anon publique ne donne accès qu'aux véhicules, qui sont des données publiques. »
- *« Tu as 92% de couverture, donc ton code est fiable ? »* → « Non, et c'est ce que mon dernier audit m'a appris : mes six bugs les plus graves étaient tous hors de portée de ma suite, parce que je testais le serveur en HTTP direct avec Supabase mocké. La couverture mesure les lignes exécutées, pas les scénarios couverts. J'ai ajouté huit tests visant précisément ces angles morts. » C'est la réponse la plus mature qu'on puisse donner sur les tests.
- *« As-tu des dépendances vulnérables ? »* → « Zéro en production côté serveur. Il reste trois avis, tous en dépendances de développement ou non applicables à mon code : je peux dire lesquels, pourquoi ils ne m'exposent pas, et ce que coûterait leur correction. » (cf. point 6, ne pas répondre juste « non ».)
- *« Pourquoi deux requêtes pour afficher le nom du client sur une réservation ? »* → « Parce qu'il n'y a pas de clé étrangère entre `reservations.client_id` et `profiles` : `client_id` référence `auth.users`. PostgREST ne peut embarquer une table liée que via une FK déclarée. J'ai donc une résolution en deux requêtes groupées côté contrôleur. Si j'ajoutais la FK, ça se réduirait à une seule requête. » (cf. point 2, c'est une bonne démonstration de compréhension de PostgREST.)
- *« Pourquoi un `manualChunks` explicite dans ta config Vite ? »* → « Parce qu'une montée de version mineure de Vite a changé l'heuristique de découpage et fait passer mon chunk d'entrée de 240 à 434 kB. Je ne veux pas que ma stratégie de cache dépende d'une heuristique : je la déclare. » (cf. Améliorations non demandées.)

---

Audit v7.1, 30 juillet 2026. Constats vérifiés par exécution, correctifs appliqués et vérifiés dans la même session. Reste à ta charge : la vérification RLS (point 4) et le test manuel des emails (point 6).
