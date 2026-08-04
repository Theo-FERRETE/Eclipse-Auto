← [Sécurité](README.md)

# Contrôles métier, validation et échappement

## Les contrôles au niveau des contrôleurs

Être authentifié ne suffit pas — il faut aussi vérifier qu'on agit sur **ses propres**
données. Ces contrôles sont dans les contrôleurs, pas dans les middlewares, parce qu'ils
dépendent de la donnée concernée.

| Endroit | Contrôle |
|---|---|
| `reservationController.cancel` | `reservation.client_id !== req.user.id` → **403**. Empêche d'annuler la réservation d'un autre. |
| `reservationController.create` | `client_id: req.user.id` — le client est **forcé depuis le token**, jamais lu dans le body. Impossible de réserver au nom de quelqu'un d'autre. |
| `reservationController.listMine` | Filtre sur `req.user.id` : on ne peut lire que ses propres réservations. |
| `reservationController.cancel` | Statut autorisé uniquement `pending` ou `confirmed` — pas de ré-annulation. |
| `reservationController.create` | Le véhicule doit être `available`, sinon **409 Conflict**. |

## Validation des entrées

Rien de ce qui vient du client n'est écrit tel quel en base.

**Véhicules** (`vehicleController.validateVehicleInput`) — année entre 1900 et l'année
suivante, prix ≥ 0, kilométrage ≥ 0, statut dans la liste autorisée de `constants.js`.

**Le mécanisme `VEHICLE_FIELDS` / `buildVehiclePayload`** mérite une mention à l'oral :
le payload d'un `PUT` n'est construit **qu'avec les champs réellement envoyés**. Sans ça,
une modification partielle écraserait les autres colonnes avec `NaN` (`parseInt(undefined)`),
sérialisé en `null` par Supabase. C'est un bug silencieux évité par construction.

**Équipements** — nom obligatoire et non vide, `prix_supplement` ≥ 0.

**Contact** — nom/email/message obligatoires, format d'email vérifié par regex, nom ≤ 100
caractères, message ≤ 5 000. Et surtout : `/[\r\n]/.test(email)` rejette les retours à la
ligne dans l'adresse — c'est une protection contre l'**injection d'en-têtes SMTP**, où un
attaquant glisserait un `\nBcc: ...` pour transformer ton formulaire en relais de spam.

**Pagination** — partout, `limit` est plafonné à 100 (`Math.min(parseInt(limit) || 50, 100)`)
et `offset` ne peut pas être négatif. Sans le plafond, `?limit=999999` permettrait de vider
la base en une requête.

## Échappement HTML dans les emails

`escapeHtml()` (`server/lib/emailTemplates.js`) remplace `& < > " '` par leurs entités
avant toute insertion dans du HTML. Les emails contiennent des données saisies par
l'utilisateur (nom, message) : sans échappement, un message contenant `<script>` ou une
balise `<img onerror=...>` serait injecté tel quel dans l'email reçu. C'est du **XSS**,
simplement transposé dans un client mail.
