# Supabase — ce que c'est et ce qu'il fait dans Eclipse Auto

| Page | Contenu |
|---|---|
| **Cette page** | Ce qu'est Supabase, et qui l'utilise dans le projet |
| [requetes.md](requetes.md) | La librairie JS traduite en SQL, et les jointures « embed » |
| [schema.md](schema.md) | Les tables, les relations, le many-to-many, le trigger |
| [cles-et-rls.md](cles-et-rls.md) | Les deux clés (`anon` / `service_role`) et la RLS |
| [auth.md](auth.md) | Comment marche la connexion |

---

## C'est quoi, en une phrase

Supabase est une **base de données PostgreSQL hébergée**, livrée avec quatre services
autour d'elle qu'on utiliserait sinon séparément :

| Service | Ce que ça remplace | Utilisé ici ? |
|---|---|---|
| **Database** | Un PostgreSQL que tu installerais toi-même | ✅ toutes les tables |
| **Auth** | Ton propre système d'inscription/connexion + hashage des mots de passe + JWT | ✅ tout le login |
| **REST (PostgREST)** | Écrire toi-même le SQL et les routes qui l'exposent | ✅ via la librairie JS |
| **Realtime** | Un WebSocket + un système d'écoute des changements | ✅ uniquement sur le catalogue |
| **Storage** | Un serveur de fichiers pour les images | ⚠️ prévu (`optimizeImageUrl` sait le gérer), mais les images actuelles sont dans `client/public/img/` |

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

Tout le reste du front passe par `fetch('/api/...')` — voir
[../../front/donnees/](../../front/donnees/README.md).
