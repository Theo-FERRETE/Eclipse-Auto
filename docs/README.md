# Documentation Eclipse Auto

Point d'entrée de la doc technique. Elle est séparée en deux : le **back** (l'API Express)
et le **front** (l'application React). Supabase est expliqué des deux côtés, parce qu'il n'y
joue pas du tout le même rôle.

## Par où commencer

Si tu es perdu dans le code, lis dans cet ordre :

1. [back/architecture.md](back/architecture.md) — la structure du serveur et le trajet d'une requête
2. [back/supabase.md](back/supabase.md) — **ce qu'est Supabase et ce qu'il fait dans ce projet**
3. [JWT.md](JWT.md) — **où est physiquement ton jeton d'authentification**, ce qu'il contient, par où il passe
4. [front/architecture.md](front/architecture.md) — la structure React, le routing, les conventions
5. [front/donnees.md](front/donnees.md) — la règle « quand passe-t-on par l'API, quand parle-t-on à Supabase ? »

## Documentation technique

### Back — `server/` · index : [back/README.md](back/README.md)

| Page | Contenu |
|---|---|
| [back/architecture.md](back/architecture.md) | Les 4 couches, le trajet d'une requête, les 6 familles de routes, le démarrage et la configuration |
| [back/supabase.md](back/supabase.md) | Ce qu'est Supabase, les requêtes et les jointures, le schéma des tables, les deux clés et la RLS, Supabase Auth |
| [back/securite.md](back/securite.md) | Les middlewares, 401 vs 403, le rôle admin, la validation des entrées, la CSP et les en-têtes HTTP |
| [back/emails.md](back/emails.md) | Nodemailer et les deux emails, le rate limiting, le gabarit HTML |

### Front — `client/` · index : [front/README.md](front/README.md)

| Page | Contenu |
|---|---|
| [front/architecture.md](front/architecture.md) | Conventions et structure, le routing et les 18 routes, le code splitting, le build, les variables d'environnement |
| [front/donnees.md](front/donnees.md) | La règle « API Express vs Supabase direct », le motif d'appel, le cache, le Realtime, les filtres URL, les doublons connus |
| [front/auth.md](front/auth.md) | `auth.js` et `AuthContext`, `ProtectedRoute`, le parcours complet d'une connexion |

### Transversal

| Fichier | Contenu |
|---|---|
| [JWT.md](JWT.md) | Où vit le jeton, comment le voir dans ton navigateur, ce que contient son payload, les deux champs `role`, ce qu'un attaquant peut ou non en faire |
| [ENDPOINTS.md](ENDPOINTS.md) | Référence complète de l'API (URL, body, réponses, codes d'erreur) |

## Documents du projet scolaire

| Fichier | Contenu |
|---|---|
| `cahier-des-charges.html` | Contexte, périmètre, exigences fonctionnelles, MCD / MLD / MPD, livrables |
| `documentation.html` | Documentation de rendu : stack, architecture, rôle de chaque fichier, routes, schéma, production |

## Révision et soutenance — [`soutenance/`](soutenance/)

| Fichier | Contenu |
|---|---|
| `soutenance/aide-revision.html` | **Le document principal pour l'oral** — les 6 questions d'authentification avec le code, les deux serveurs, les 4 mots, REST et le sans-état, les pièges |
| [soutenance/lexique.md](soutenance/lexique.md) | Le socle en 14 notions, rangées par compétence (CP1 → CP8) |
| [soutenance/notes.md](soutenance/notes.md) | Retour du jury blanc et plan de refonte des slides |
| [soutenance/fiches-react.md](soutenance/fiches-react.md) | Anatomie des fonctions React du projet |
| [soutenance/fiches-sql.md](soutenance/fiches-sql.md) | Fiches SQL sur le schéma réel |

## Archive

[archive/AUDIT_REPORT.md](archive/AUDIT_REPORT.md) — rapport d'audit v7 et suivi des correctifs.
Document de travail, conservé pour l'historique.

## Vue d'ensemble en une image

```text
Navigateur
    │
    ├── React (client/) ──────────────► Supabase Auth      : login, signup, session, JWT
    │        │                          Supabase REST      : lecture catalogue, lecture profil
    │        │                          Supabase Realtime  : mise à jour live du catalogue
    │        │
    │        └── fetch('/api/...') ──► Express (server/) ──► Supabase (clé service_role)
    │             + Bearer <JWT>              │                toutes les écritures
    │                                         │                + les lectures sensibles
    │                                         └── Nodemailer → Gmail (2 emails)
    │
    └── en dev : Vite (port 5173) proxifie /api vers le port 3001
        en prod : Express sert directement le build React (client/dist)
```
