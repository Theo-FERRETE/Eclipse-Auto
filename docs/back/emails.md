← [Back](README.md)

# Back : les emails

Le projet envoie **deux emails**, tous les deux via [Nodemailer](https://nodemailer.com/)
et un compte Gmail.

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

## Email n°1 : le formulaire de contact

**Fichier** : `server/controllers/contactController.js` → `send()`
**Déclenché par** : `POST /api/contact` (route publique)
**Destinataire** : toi (`GMAIL_USER`, le site s'envoie le message à lui-même)

Le champ `replyTo` est renseigné avec l'email du visiteur : quand tu réponds depuis ta boîte,
la réponse part chez lui et non chez toi. Le champ `from`, lui, reste ton adresse, mettre
celle du visiteur ferait passer le message pour une usurpation aux yeux de Gmail.

Le corps HTML est court et toutes les valeurs passent par `escapeHtml()`.

C'est la seule route publique du projet qui déclenche un envoi d'email, donc la seule qui
a besoin d'être limitée en débit → [rate limiting](#le-rate-limiting-du-formulaire-de-contact).

## Email n°2 : la confirmation de réservation

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
3. **Uniquement si `status === 'confirmed'`** : pas d'email pour `pending` ou `cancelled`.
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

---

## Le rate limiting du formulaire de contact

C'est le seul endroit du projet qui en a besoin, une route publique qui déclenche un envoi
d'email est une cible évidente pour du spam ou pour épuiser le quota Gmail.

L'implémentation est **maison, en mémoire** (`server/controllers/contactController.js`) :

```text
ipRequestCounts : Map<ip, number[]>     un tableau d'horodatages par IP
WINDOW_MS       : 15 minutes
MAX_REQUESTS    : 5
```

### Comment ça marche

À chaque requête :

1. `purgeExpired()` supprime les IP dont tous les horodatages sont périmés, sans ça, la
   `Map` grossirait indéfiniment (une entrée par IP vue depuis le démarrage : une fuite de
   mémoire).
2. On filtre les horodatages de l'IP courante pour ne garder que ceux de la fenêtre.
3. Si on est déjà à 5 → **429 Too Many Requests**.
4. Sinon on ajoute l'horodatage courant et on continue.

C'est une **fenêtre glissante** : une IP peut reposter dès que sa plus ancienne requête
sort des 15 minutes, sans attendre un « tour » complet.

Le contrôle passe **avant** la validation du corps de la requête : sinon on pourrait
marteler la route avec des corps invalides sans jamais consommer son quota.

### Limite assumée

Le compteur vit dans la mémoire du processus. Un redémarrage le remet à zéro, et avec
plusieurs instances du serveur chacune aurait le sien. Pour une vraie mise en production à
l'échelle, il faudrait Redis ou `express-rate-limit` avec un store partagé.

À l'échelle du projet, c'est suffisant et ça évite une dépendance de plus, c'est une
réponse honnête à donner si le jury pose la question.

### Lien avec `trust proxy`

Le rate limiting s'appuie sur `req.ip`. Si Express faisait aveuglément confiance à l'en-tête
`X-Forwarded-For`, n'importe qui pourrait le falsifier à chaque requête et se donner une IP
différente. D'où le `TRUST_PROXY` conditionnel dans `app.js` : voir
[securite.md](securite.md#le-reste-des-protections).

---

## Le gabarit HTML : `server/lib/emailTemplates.js`

Deux fonctions exportées :

- **`escapeHtml(text)`** : remplace `& < > " '` par leurs entités HTML. Appelée sur toutes
  les données utilisateur avant insertion (voir
  [securite.md](securite.md#échappement-html-dans-les-emails)).
- **`buildConfirmationEmail(firstName, vehicle, rdvDate)`** : retourne le HTML complet.

### Pourquoi ce HTML est écrit « comme en 2005 »

Des `<table>` imbriquées, des styles **en attribut `style=` inline**, aucune feuille de
style, aucune `<div>` en flexbox. Ce n'est pas de la négligence : les clients mail
(Outlook, Gmail, Apple Mail) ne supportent pas le CSS moderne. Outlook utilise même le
moteur de rendu de Word. Les tables et le style inline sont le seul dénominateur commun
qui s'affiche correctement partout.

### Le contenu

Le rendu reprend l'identité du site : fond `#0a0a0a`, accent rouge `#e8000d`, secondaire
cyan `#00d4ff`, police monospace, titres en majuscules.

Contenu : le prénom, la marque/modèle/année, le prix formaté en euros
(`toLocaleString('fr-FR')`), et la ligne « Rendez-vous » **seulement si** `rdv_date`
est renseignée (`rdvLine` vaut la chaîne vide sinon). Un pied de page rappelle qu'il
s'agit d'un projet éducatif sans transaction réelle.

**Objet** : `Votre réservation est confirmée, {Brand} {Model}`

---

## Tests

- `server/__tests__/lib/emailTemplates.test.js` teste le gabarit et l'échappement, c'est
  de la logique pure, facile à vérifier.
- Les tests d'intégration **mockent** Nodemailer : ils vérifient que l'envoi est déclenché
  aux bonnes conditions, pas qu'un email part réellement.

**À faire** : tester manuellement les deux envois au moins une fois avant l'oral.
Les tests ne couvrent pas la connexion SMTP réelle, une variable d'environnement mal
renseignée ne serait vue qu'en conditions réelles.
