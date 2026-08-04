# Back — les emails

Le projet envoie **deux emails**, tous les deux via [Nodemailer](https://nodemailer.com/)
et un compte Gmail.

| Page | Contenu |
|---|---|
| **Cette page** | Configuration Gmail, les deux emails, les tests |
| [rate-limiting.md](rate-limiting.md) | La limitation par IP du formulaire de contact |
| [gabarit-html.md](gabarit-html.md) | `emailTemplates.js` et pourquoi ce HTML est si vieillot |

---

## Configuration

Le transporteur est créé une fois par contrôleur concerné :

```js
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})
```

`GMAIL_APP_PASSWORD` n'est **pas** le mot de passe du compte Google : c'est un *mot de
passe d'application* à 16 caractères, généré depuis les paramètres de sécurité Google
(la validation en deux étapes doit être active). Google refuse depuis 2022 la connexion
SMTP avec le mot de passe principal.

## Email n°1 — le formulaire de contact

**Fichier** : `server/controllers/contactController.js` → `send()`
**Déclenché par** : `POST /api/contact` (route publique)
**Destinataire** : toi (`GMAIL_USER` — le site s'envoie le message à lui-même)

Le champ `replyTo` est renseigné avec l'email du visiteur : quand tu réponds depuis ta boîte,
la réponse part chez lui et non chez toi. Le champ `from`, lui, reste ton adresse — mettre
celle du visiteur ferait passer le message pour une usurpation aux yeux de Gmail.

Le corps HTML est court et toutes les valeurs passent par `escapeHtml()`.

C'est la seule route publique du projet qui déclenche un envoi d'email, donc la seule qui
a besoin d'être limitée en débit → [rate-limiting.md](rate-limiting.md).

## Email n°2 — la confirmation de réservation

**Fichier** : `server/controllers/reservationController.js` → `updateStatus()`
**Déclenché par** : `PATCH /api/reservations/:id/status` avec `{ status: "confirmed" }`
(route admin uniquement)
**Destinataire** : le client concerné

### Le déroulé

1. Avant la mise à jour, `findWithVehicleForEmail(id)` récupère `client_id`, `rdv_date`
   et les infos du véhicule (`brand`, `model`, `year`, `price`).
   *Pourquoi avant ?* Parce qu'il faut de toute façon vérifier que la réservation existe
   (**404** sinon), et autant récupérer les données de l'email au passage.
2. Le statut est mis à jour.
3. **Uniquement si `status === 'confirmed'`** — pas d'email pour `pending` ou `cancelled`.
4. `getAuthUserAndProfile(clientId)` fait deux appels **en parallèle** avec `Promise.all` :
   - `supabase.auth.admin.getUserById()` → l'email (il est dans `auth.users`, pas dans `profiles`)
   - `supabase.from('profiles').select('first_name')` → le prénom
5. `buildConfirmationEmail(firstName, vehicle, rdvDate)` génère le HTML.
6. Envoi.

### Le point important : l'envoi ne peut pas casser la requête

```js
try {
  // ... envoi
} catch (emailErr) {
  console.error('[Reservations] Erreur envoi email :', emailErr)
}
res.json(data)
```

L'envoi est dans un `try/catch` **qui n'interrompt rien**. Si Gmail est indisponible,
la réservation reste confirmée en base et l'admin reçoit une réponse 200. L'erreur est
seulement loguée.

C'est un choix délibéré : l'email est une notification, pas une opération métier. Faire
échouer la confirmation parce qu'un serveur SMTP tousse serait pire que de ne pas envoyer
l'email. À l'oral, c'est exactement le genre de décision à savoir justifier.

## Tests

- `server/__tests__/lib/emailTemplates.test.js` teste le gabarit et l'échappement — c'est
  de la logique pure, facile à vérifier.
- Les tests d'intégration **mockent** Nodemailer : ils vérifient que l'envoi est déclenché
  aux bonnes conditions, pas qu'un email part réellement.

⚠️ **À faire** : tester manuellement les deux envois au moins une fois avant l'oral.
Les tests ne couvrent pas la connexion SMTP réelle — une variable d'environnement mal
renseignée ne serait vue qu'en conditions réelles.
