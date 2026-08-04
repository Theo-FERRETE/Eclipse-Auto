← [Supabase](README.md)

# Les deux clés et la RLS

## Les deux clés — le point de sécurité central

Il y a **deux clients Supabase distincts dans le projet**, avec deux clés différentes.
Confondre les deux serait la faille la plus grave possible.

| | Serveur | Client (navigateur) |
|---|---|---|
| Fichier | `server/supabase.js` | `client/src/lib/supabase.js` |
| Clé | `SUPABASE_SERVICE_ROLE_KEY` | `VITE_SUPABASE_ANON_KEY` |
| Pouvoir | **Contourne toute la RLS.** Peut lire/écrire n'importe quelle ligne, supprimer un compte auth | Limité par la RLS et par les permissions du rôle `anon` / `authenticated` |
| Visibilité | Dans `server/.env`, jamais envoyée au navigateur | **Publique** — présente dans le bundle JS, visible par n'importe qui |

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

## La RLS (Row Level Security)

C'est le mécanisme de sécurité propre à Postgres/Supabase : des règles écrites **dans la
base** qui décident, ligne par ligne, ce qu'un rôle a le droit de lire ou d'écrire.
Exemple de politique : « un utilisateur ne peut lire une ligne de `reservations` que si
`client_id = auth.uid()` ».

Elle s'applique à la clé `anon` (navigateur) — **pas** à la clé `service_role` (serveur).

**État actuel du projet** : le rôle `anon` est cloisonné (401 sur `reservations` et
`equipements`, `profiles` renvoie une liste vide). Le rôle `authenticated` n'a pas été
testé faute de compte de test. Le risque est neutralisé structurellement — depuis que les
lectures sensibles passent par Express, le navigateur n'a plus besoin d'y accéder — mais
activer la RLS reste à faire au titre de la **défense en profondeur** : si une faille
laissait fuiter un accès, la base refuserait quand même.

C'est un point que le jury peut creuser : sache dire *pourquoi* c'est une deuxième couche
et pas la première.
