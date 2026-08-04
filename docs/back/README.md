← [Documentation](../README.md)

# Back — l'API Express

Dossier : `server/`. Environ 1 100 lignes de code métier (hors tests).
Express 5, en **CommonJS** (`require` / `module.exports`, pas d'`import`).

## Sommaire

| Dossier | Contenu |
|---|---|
| [architecture/](architecture/README.md) | Les 4 couches, le trajet d'une requête, les routes · [démarrage et config](architecture/demarrage.md) |
| [supabase/](supabase/README.md) | Ce qu'est Supabase · [requêtes](supabase/requetes.md) · [schéma](supabase/schema.md) · [clés et RLS](supabase/cles-et-rls.md) · [Auth](supabase/auth.md) |
| [securite/](securite/README.md) | JWT et middlewares · [validation](securite/validation.md) · [en-têtes HTTP](securite/entetes-http.md) |
| [emails/](emails/README.md) | Nodemailer et les 2 emails · [rate limiting](emails/rate-limiting.md) · [gabarit HTML](emails/gabarit-html.md) |

Référence des routes : [../ENDPOINTS.md](../ENDPOINTS.md).

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
