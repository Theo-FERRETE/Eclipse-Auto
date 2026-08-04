# Documentation Eclipse Auto

Point d'entrée de la doc technique. Elle est séparée en deux : le **back** (l'API Express)
et le **front** (l'application React). Supabase est expliqué des deux côtés, parce qu'il n'y
joue pas du tout le même rôle.

## Par où commencer

Si tu es perdu dans le code, lis dans cet ordre :

1. [back/architecture/](back/architecture/README.md) — les 4 couches du serveur et le trajet d'une requête
2. [back/supabase/](back/supabase/README.md) — **ce qu'est Supabase et ce qu'il fait dans ce projet**
3. [JWT.md](JWT.md) — **où est physiquement ton jeton d'authentification**, ce qu'il contient, par où il passe
4. [front/architecture/](front/architecture/README.md) — la structure React, le routing, les conventions
5. [front/donnees/](front/donnees/README.md) — la règle « quand passe-t-on par l'API, quand parle-t-on à Supabase ? »

## Back — `server/`

Index : [back/README.md](back/README.md)

| Dossier | Pages |
|---|---|
| [architecture/](back/architecture/README.md) | Les 4 couches, le trajet d'une requête, les 6 familles de routes · [démarrage et configuration](back/architecture/demarrage.md) |
| [supabase/](back/supabase/README.md) | Ce qu'est Supabase et qui l'utilise · [requêtes et jointures](back/supabase/requetes.md) · [schéma des tables](back/supabase/schema.md) · [les 2 clés et la RLS](back/supabase/cles-et-rls.md) · [Supabase Auth](back/supabase/auth.md) |
| [securite/](back/securite/README.md) | JWT, middlewares, 401 vs 403 · [validation des entrées](back/securite/validation.md) · [CSP, CORS et en-têtes](back/securite/entetes-http.md) |
| [emails/](back/emails/README.md) | Nodemailer et les 2 emails · [rate limiting](back/emails/rate-limiting.md) · [gabarit HTML](back/emails/gabarit-html.md) |

## Front — `client/`

Index : [front/README.md](front/README.md)

| Dossier | Pages |
|---|---|
| [architecture/](front/architecture/README.md) | Conventions et structure des dossiers · [routing](front/architecture/routing.md) · [performance, build et env](front/architecture/performance.md) |
| [donnees/](front/donnees/README.md) | API Express vs Supabase direct · [cache véhicules](front/donnees/cache.md) · [Realtime](front/donnees/realtime.md) · [filtres dans l'URL](front/donnees/filtres-url.md) · [doublons connus](front/donnees/doublons.md) |
| [auth/](front/auth/README.md) | `auth.js` et `AuthContext` · [ProtectedRoute](front/auth/protected-route.md) · [parcours de connexion](front/auth/parcours.md) |

## Transversal

| Fichier | Contenu |
|---|---|
| [JWT.md](JWT.md) | Où vit le jeton, comment le voir dans ton navigateur, ce que contient son payload, les deux champs `role`, ce qu'un attaquant peut ou non en faire |

## Autres documents déjà existants

| Fichier | Contenu |
|---|---|
| [ENDPOINTS.md](ENDPOINTS.md) | Référence complète de l'API (URL, body, réponses, codes d'erreur) |
| [fiches-revision.md](fiches-revision.md) | Fiches pour l'oral : architecture, choix techniques, questions du jury |
| [fiches-revision-react.md](fiches-revision-react.md) | Fiches React |
| [fiches-revision-sql.md](fiches-revision-sql.md) | Fiches SQL sur le schéma réel |
| `cahier-des-charges.html` / `documentation.html` | Documents du projet scolaire |

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
