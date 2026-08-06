← [Documentation](../README.md)

# Back — l'API Express

Dossier : `server/`. Environ 1 100 lignes de code métier (hors tests).
Express 5, en **CommonJS** (`require` / `module.exports`, pas d'`import`).

## Sommaire

| Page | Contenu |
|---|---|
| [architecture.md](architecture.md) | Les 4 couches, le trajet d'une requête, les 6 familles de routes, le démarrage et la configuration |
| [supabase.md](supabase.md) | Ce qu'est Supabase, les requêtes et les jointures, le schéma des tables, les deux clés et la RLS, Supabase Auth |
| [securite.md](securite.md) | Les middlewares, 401 vs 403, le rôle admin, la validation des entrées, la CSP et les en-têtes HTTP |
| [emails.md](emails.md) | Nodemailer et les deux emails, le rate limiting, le gabarit HTML |

Référence des routes (body attendu, réponses, codes d'erreur) : [../ENDPOINTS.md](../ENDPOINTS.md).
Le jeton lui-même — où il vit, ce qu'il contient : [../JWT.md](../JWT.md).

## Arborescence commentée

```text
server/
├── index.js            Démarrage : vérifie les variables d'env, écoute sur le port 3001
├── app.js              Assemblage de l'app Express : Helmet/CSP, middlewares, routes, static, erreurs
├── supabase.js         Crée LE client Supabase du serveur (clé service_role)
├── constants.js        Listes de valeurs autorisées (statuts, carburants, transmissions)
│
├── middleware/
│   ├── setup.js        CORS, compression, morgan (logs), express.json()
│   └── auth.js         requireAuth / requireAdmin — vérifient le JWT
│
├── routes/             « Quelle URL, quelle méthode, qui a le droit »
│   ├── api.js          Le hub : monte les 6 routeurs sous /api
│   ├── vehicles.js     /api/vehicles
│   ├── reservations.js /api/reservations
│   ├── admin.js        /api/admin
│   ├── equipements.js  /api/equipements
│   ├── contact.js      /api/contact
│   └── health.js       /api/health
│
├── controllers/        « Quoi faire » : validation des entrées + logique métier + code HTTP
│   ├── vehicleController.js
│   ├── reservationController.js
│   ├── adminController.js
│   ├── equipementController.js
│   └── contactController.js
│
├── models/             « Comment parler à la base » : requêtes Supabase, rien d'autre
│   ├── vehicleModel.js
│   ├── reservationModel.js
│   ├── adminModel.js
│   └── equipementModel.js
│
├── lib/
│   └── emailTemplates.js  Gabarit HTML de l'email de confirmation + escapeHtml()
│
└── __tests__/          65 tests Jest + Supertest (intégration sur de vraies requêtes HTTP)
```
