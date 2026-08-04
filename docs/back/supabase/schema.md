← [Supabase](README.md)

# Le schéma : les tables utilisées par le code

Ce sont les tables et colonnes réellement manipulées dans `models/` et côté client.

## `vehicles`

| Colonne | Notes |
|---|---|
| `id` | UUID, clé primaire |
| `brand`, `model` | obligatoires — servent aussi à fabriquer le **slug** de l'URL |
| `year`, `price`, `mileage` | validés côté serveur (année 1900 → année+1, prix ≥ 0, km ≥ 0) |
| `fuel_type`, `transmission` | obligatoires à la création |
| `power`, `description` | optionnels |
| `status` | `available` \| `reserved` \| `sold` — liste dans `server/constants.js` |
| `images` | tableau d'URLs |
| `created_at` | tri par défaut : plus récent d'abord |

## `reservations`

| Colonne | Notes |
|---|---|
| `id` | UUID |
| `client_id` | → `auth.users.id` (**pas** `profiles`, voir [requetes.md](requetes.md)) |
| `vehicle_id` | → `vehicles.id` |
| `status` | `pending` \| `confirmed` \| `cancelled` |
| `message`, `rdv_date` | optionnels, saisis par le client |
| `created_at` | |

## `profiles`

Table applicative liée 1-pour-1 à `auth.users` (`profiles.id = auth.users.id`).
Supabase Auth gère l'identité (email, mot de passe) ; `profiles` porte les données métier :
`first_name`, `last_name`, `role` (`client` \| `admin`), `created_at`, etc.

## `equipements`

`id`, `nom`, `categorie`, `prix_supplement`. Catalogue d'options **indépendant des véhicules** :
le client pioche dedans au moment de sa demande de réservation.

## `reservation_equipements`

Table de liaison **many-to-many** : `reservation_id` + `equipement_id`.
C'est la démonstration de relation N-N du projet. Une réservation a plusieurs équipements,
un équipement peut être choisi dans plusieurs réservations.

## Vue d'ensemble

```
vehicles ──1─┬─N── reservations ──N─┬─N── equipements
             │                       │
        (vehicle_id)      (via reservation_equipements)

auth.users ──1──1── profiles
     ↑
 (client_id, sans FK vers profiles)
```

## Le trigger PostgreSQL

Quand le statut d'une réservation change, un **trigger côté base** met à jour
`vehicles.status` automatiquement. Le serveur n'a donc pas à le faire lui-même
(commentaire dans `reservationController.updateStatus`). C'est une règle métier
placée dans la base pour qu'elle s'applique quel que soit le code qui écrit.

⚠️ Il n'est **pas versionné dans le dépôt** : tu ne peux pas en montrer le code au jury,
seulement expliquer son rôle et où il se trouve (Supabase → Database → Triggers).
