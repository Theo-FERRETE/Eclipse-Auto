← [Back](README.md)

# Supabase : ce que c'est et ce qu'il fait ici

## En une phrase

Supabase est une **base de données PostgreSQL hébergée**, livrée avec quatre services
autour d'elle qu'on utiliserait sinon séparément :

| Service | Ce que ça remplace | Utilisé ici ? |
|---|---|---|
| **Database** | Un PostgreSQL que tu installerais toi-même | oui, toutes les tables |
| **Auth** | Ton propre système d'inscription/connexion + hashage des mots de passe + JWT | oui, tout le login |
| **REST (PostgREST)** | Écrire toi-même le SQL et les routes qui l'exposent | oui, via la librairie JS |
| **Realtime** | Un WebSocket + un système d'écoute des changements | oui, uniquement sur le catalogue |
| **Storage** | Un serveur de fichiers pour les images | pas encore : prévu (`optimizeImageUrl` sait le gérer), mais les images actuelles sont dans `client/public/img/` |

Autrement dit : **ce n'est pas un ORM, ce n'est pas un framework**. C'est un Postgres
distant + une librairie JS (`@supabase/supabase-js`) qui traduit des appels de méthodes
en requêtes HTTP vers ce Postgres.

## Qui utilise Supabase, et pour quoi

| Fichier | Ce qu'il fait avec Supabase |
|---|---|
| `server/supabase.js` | Crée le client `service_role` |
| `server/models/*.js` | **Toutes** les requêtes SQL du serveur, nulle part ailleurs |
| `server/middleware/auth.js` | `auth.getUser(token)` pour valider le JWT |
| `client/src/lib/supabase.js` | Crée le client `anon` |
| `client/src/lib/auth.js` | login / register / logout / session / profil |
| `client/src/lib/AuthContext.jsx` | Session React + écoute `onAuthStateChange` |
| `client/src/lib/vehiclesCache.js` | Lecture du catalogue (donnée publique) + cache 3 min |
| `client/src/pages/Catalogue/Catalogue.jsx` | Abonnement **Realtime** aux changements de `vehicles` |
| `client/src/pages/ForgotPassword` / `ResetPassword` | Réinitialisation du mot de passe |
| `client/src/components/DashboardProfile` | `update()` sur sa propre ligne `profiles` + `auth.updateUser()` pour le mot de passe |

Tout le reste du front passe par `fetch('/api/...')` : voir
[../front/donnees.md](../front/donnees.md).

---

## Les requêtes : de la librairie JS au SQL

### La librairie n'est qu'un traducteur SQL → HTTP

Quand tu écris dans `models/vehicleModel.js` :

```js
supabase.from('vehicles').select('*').eq('id', id).single()
```

Il ne se passe rien de magique. La librairie construit une URL et l'appelle :

```http
GET https://<projet>.supabase.co/rest/v1/vehicles?id=eq.<id>&select=*
Authorization: Bearer <clé>
Accept: application/vnd.pgrst.object+json      ← c'est ça, .single()
```

Côté Supabase, **PostgREST** traduit cette URL en `SELECT * FROM vehicles WHERE id = ...`.

Le tableau de correspondance à connaître pour l'oral :

| Méthode JS | Équivalent SQL |
|---|---|
| `.from('vehicles')` | `FROM vehicles` |
| `.select('*')` | `SELECT *` |
| `.eq('status', 'available')` | `WHERE status = 'available'` |
| `.in('id', ids)` | `WHERE id IN (...)` |
| `.order('created_at', { ascending: false })` | `ORDER BY created_at DESC` |
| `.range(0, 49)` | `LIMIT 50 OFFSET 0` |
| `.single()` | Attend exactement 1 ligne, sinon erreur |
| `.insert(obj)` | `INSERT INTO ...` |
| `.update(obj).eq('id', id)` | `UPDATE ... WHERE id = ...` |
| `.delete().eq('id', id)` | `DELETE FROM ... WHERE id = ...` |
| `.select('*', { count: 'exact', head: true })` | `SELECT COUNT(*)` sans ramener les lignes |

**Point important** : chaque appel retourne toujours un objet `{ data, error }`. La librairie
ne lève pas d'exception sur une erreur SQL, elle la met dans `error`. C'est pour ça que
tout le code du projet ressemble à :

```js
const { data, error } = await vehicleModel.findAll(...)
if (error) return res.status(500).json({ error: error.message })
```

### Les jointures : l'« embed » PostgREST

C'est la syntaxe la plus déroutante du projet. Dans `models/reservationModel.js` :

```js
.select('*, vehicles(brand, model, images, price), reservation_equipements(equipements(id, nom, prix_supplement))')
```

Ça veut dire : « prends toutes les colonnes de `reservations`, et **en plus**, pour chaque
ligne, va chercher le véhicule lié et les équipements liés ». PostgREST le fait en une
seule requête et renvoie du JSON imbriqué :

```json
{
  "id": "...", "status": "pending",
  "vehicles": { "brand": "BMW", "model": "M5", "price": 90000 },
  "reservation_equipements": [ { "equipements": { "id": "...", "nom": "GPS" } } ]
}
```

Le contrôleur aplatit ensuite `reservation_equipements` en un simple tableau `equipements`
(fonction `formatReservationEquipements` dans `reservationController.js`).

**Condition indispensable** : l'embed ne fonctionne que s'il existe une **clé étrangère**
entre les deux tables. PostgREST lit les contraintes du schéma pour savoir comment joindre.

### La conséquence à connaître par cœur pour l'oral

Il n'existe **aucune clé étrangère `reservations.client_id → profiles.id`** : la colonne
`client_id` référence `auth.users`, pas `profiles`. Donc `select('*, profiles(...)')` sur
`reservations` **échoue**. C'est pour ça que le nom du client est résolu en **deux requêtes**,
dans la fonction `withClientNames()` de `reservationController.js` :

1. récupérer les réservations,
2. faire un seul `SELECT ... FROM profiles WHERE id IN (liste des client_id distincts)`,
3. recoller les noms côté JavaScript avec une `Map`.

Une requête groupée, pas une par réservation : c'est ce qui évite le problème classique
du « N+1 ».

---

## Le schéma des tables

Ce sont les tables et colonnes réellement manipulées dans `models/` et côté client.

### `vehicles`

| Colonne | Notes |
|---|---|
| `id` | UUID, clé primaire |
| `brand`, `model` | obligatoires, servent aussi à fabriquer le **slug** de l'URL |
| `year`, `price`, `mileage` | validés côté serveur (année 1900 → année+1, prix ≥ 0, km ≥ 0) |
| `fuel_type`, `transmission` | obligatoires à la création |
| `power`, `description` | optionnels |
| `status` | `available` \| `reserved` \| `sold` : liste dans `server/constants.js` |
| `images` | tableau d'URLs |
| `created_at` | tri par défaut : plus récent d'abord |

### `reservations`

| Colonne | Notes |
|---|---|
| `id` | UUID |
| `client_id` | → `auth.users.id` (**pas** `profiles`, voir ci-dessus) |
| `vehicle_id` | → `vehicles.id` |
| `status` | `pending` \| `confirmed` \| `cancelled` |
| `message`, `rdv_date` | optionnels, saisis par le client |
| `created_at` | |

### `profiles`

Table applicative liée 1-pour-1 à `auth.users` (`profiles.id = auth.users.id`).
Supabase Auth gère l'identité (email, mot de passe) ; `profiles` porte les données métier :
`first_name`, `last_name`, `role` (`client` \| `admin`), `created_at`, etc.

### `equipements`

`id`, `nom`, `categorie`, `prix_supplement`. Catalogue d'options **indépendant des véhicules** :
le client pioche dedans au moment de sa demande de réservation.

### `reservation_equipements`

Table de liaison **many-to-many** : `reservation_id` + `equipement_id`.
C'est la démonstration de relation N-N du projet. Une réservation a plusieurs équipements,
un équipement peut être choisi dans plusieurs réservations.

### Vue d'ensemble

```
vehicles ──1─┬─N── reservations ──N─┬─N── equipements
             │                       │
        (vehicle_id)      (via reservation_equipements)

auth.users ──1──1── profiles
     ↑
 (client_id, sans FK vers profiles)
```

### Le trigger PostgreSQL

Quand le statut d'une réservation change, un **trigger côté base** met à jour
`vehicles.status` automatiquement. Le serveur n'a donc pas à le faire lui-même
(commentaire dans `reservationController.updateStatus`). C'est une règle métier
placée dans la base pour qu'elle s'applique quel que soit le code qui écrit.

Attention, il n'est **pas versionné dans le dépôt** : tu ne peux pas en montrer le code
au jury, seulement expliquer son rôle et où il se trouve (Supabase, Database, Triggers).

---

## Les deux clés et la RLS

### Les deux clés : le point de sécurité central

Il y a **deux clients Supabase distincts dans le projet**, avec deux clés différentes.
Confondre les deux serait la faille la plus grave possible.

| | Serveur | Client (navigateur) |
|---|---|---|
| Fichier | `server/supabase.js` | `client/src/lib/supabase.js` |
| Clé | `SUPABASE_SERVICE_ROLE_KEY` | `VITE_SUPABASE_ANON_KEY` |
| Pouvoir | **Contourne toute la RLS.** Peut lire/écrire n'importe quelle ligne, supprimer un compte auth | Limité par la RLS et par les permissions du rôle `anon` / `authenticated` |
| Visibilité | Dans `server/.env`, jamais envoyée au navigateur | **Publique** : présente dans le bundle JS, visible par n'importe qui |

La clé `anon` est *conçue* pour être publique : elle ne dit pas « tu es admin », elle dit
juste « tu es un client légitime de ce projet Supabase ». Ce qui protège les données,
c'est la RLS derrière.

La clé `service_role` est l'inverse : c'est un passe-partout. Elle vit uniquement sur le
serveur, et c'est précisément pour ça que **toutes les écritures qui touchent les données
d'autrui passent par Express** : c'est le seul endroit où on peut vérifier qui tu es avant
de laisser le passe-partout agir. La seule écriture restée en direct depuis le navigateur
est celle de son **propre** profil (`DashboardProfile`), où l'utilisateur ne peut de toute
façon modifier que sa propre ligne.

`server/supabase.js` la configure avec `persistSession: false` et `autoRefreshToken: false` :
sur un serveur, il n'y a pas de « session courante » à mémoriser, chaque requête porte
son propre token.

### La RLS (Row Level Security)

C'est le mécanisme de sécurité propre à Postgres/Supabase : des règles écrites **dans la
base** qui décident, ligne par ligne, ce qu'un rôle a le droit de lire ou d'écrire.
Exemple de politique : « un utilisateur ne peut lire une ligne de `reservations` que si
`client_id = auth.uid()` ».

Elle s'applique à la clé `anon` (navigateur) : **pas** à la clé `service_role` (serveur).

**État actuel du projet** : le rôle `anon` est cloisonné (401 sur `reservations` et
`equipements`, `profiles` renvoie une liste vide). Le rôle `authenticated` n'a pas été
testé faute de compte de test. Le risque est neutralisé structurellement, depuis que les
lectures sensibles passent par Express, le navigateur n'a plus besoin d'y accéder, mais
activer la RLS reste à faire au titre de la **défense en profondeur** : si une faille
laissait fuiter un accès, la base refuserait quand même.

C'est un point que le jury peut creuser : sache dire *pourquoi* c'est une deuxième couche
et pas la première.

---

## Supabase Auth

Cette section décrit **qui émet le jeton et par quelles fonctions**. Ce qu'est ce jeton,
ce qu'il contient et pourquoi le serveur peut lui faire confiance : [JWT.md](JWT.md).

1. Le front appelle `supabase.auth.signInWithPassword({ email, password })`
   (`client/src/lib/auth.js`).
2. Supabase vérifie le mot de passe (hashé chez lui, le projet ne stocke **jamais** de
   mot de passe) et renvoie un **JWT** (`access_token`) + un refresh token.
3. La librairie stocke la session dans le `localStorage` du navigateur et la rafraîchit
   toute seule à l'expiration.
4. À chaque appel à l'API, le front récupère ce token et l'envoie :
   `Authorization: Bearer <access_token>`.
5. Le serveur le vérifie avec `supabase.auth.getUser(token)` dans `middleware/auth.js`.

**Ce qu'il faut retenir** : le JWT est signé par Supabase. Un utilisateur ne peut ni le
fabriquer ni en modifier le contenu, la signature ne collerait plus. C'est ce qui rend
`req.user.id` digne de confiance côté serveur, et c'est pourquoi le `client_id` d'une
réservation est **forcé depuis le token**, jamais lu depuis le body de la requête.

### Les fonctions d'Auth utilisées

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

Le détail complet du jeton, où il est stocké, ce qu'il contient, par où il passe, est
dans [JWT.md](JWT.md).
