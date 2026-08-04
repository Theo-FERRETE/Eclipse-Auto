← [Les emails](README.md)

# Le rate limiting du formulaire de contact

C'est le seul endroit du projet qui en a besoin — une route publique qui déclenche un envoi
d'email est une cible évidente pour du spam ou pour épuiser le quota Gmail.

L'implémentation est **maison, en mémoire** (`server/controllers/contactController.js`) :

```text
ipRequestCounts : Map<ip, number[]>     un tableau d'horodatages par IP
WINDOW_MS       : 15 minutes
MAX_REQUESTS    : 5
```

## Comment ça marche

À chaque requête :

1. `purgeExpired()` supprime les IP dont tous les horodatages sont périmés — sans ça, la
   `Map` grossirait indéfiniment (une entrée par IP vue depuis le démarrage : une fuite de
   mémoire).
2. On filtre les horodatages de l'IP courante pour ne garder que ceux de la fenêtre.
3. Si on est déjà à 5 → **429 Too Many Requests**.
4. Sinon on ajoute l'horodatage courant et on continue.

C'est une **fenêtre glissante** : une IP peut reposter dès que sa plus ancienne requête
sort des 15 minutes, sans attendre un « tour » complet.

Le contrôle passe **avant** la validation du corps de la requête : sinon on pourrait
marteler la route avec des corps invalides sans jamais consommer son quota.

## Limite assumée

Le compteur vit dans la mémoire du processus. Un redémarrage le remet à zéro, et avec
plusieurs instances du serveur chacune aurait le sien. Pour une vraie mise en production à
l'échelle, il faudrait Redis ou `express-rate-limit` avec un store partagé.

À l'échelle du projet, c'est suffisant et ça évite une dépendance de plus — c'est une
réponse honnête à donner si le jury pose la question.

## Lien avec `trust proxy`

Le rate limiting s'appuie sur `req.ip`. Si Express faisait aveuglément confiance à l'en-tête
`X-Forwarded-For`, n'importe qui pourrait le falsifier à chaque requête et se donner une IP
différente. D'où le `TRUST_PROXY` conditionnel dans `app.js` — voir
[../securite/entetes-http.md](../securite/entetes-http.md).
