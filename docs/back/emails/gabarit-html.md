← [Les emails](README.md)

# Le gabarit HTML — `server/lib/emailTemplates.js`

Deux fonctions exportées :

- **`escapeHtml(text)`** — remplace `& < > " '` par leurs entités HTML. Appelée sur toutes
  les données utilisateur avant insertion (voir
  [../securite/validation.md](../securite/validation.md)).
- **`buildConfirmationEmail(firstName, vehicle, rdvDate)`** — retourne le HTML complet.

## Pourquoi ce HTML est écrit « comme en 2005 »

Des `<table>` imbriquées, des styles **en attribut `style=` inline**, aucune feuille de
style, aucune `<div>` en flexbox. Ce n'est pas de la négligence : les clients mail
(Outlook, Gmail, Apple Mail) ne supportent pas le CSS moderne. Outlook utilise même le
moteur de rendu de Word. Les tables et le style inline sont le seul dénominateur commun
qui s'affiche correctement partout.

## Le contenu

Le rendu reprend l'identité du site : fond `#0a0a0a`, accent rouge `#e8000d`, secondaire
cyan `#00d4ff`, police monospace, titres en majuscules.

Contenu : le prénom, la marque/modèle/année, le prix formaté en euros
(`toLocaleString('fr-FR')`), et la ligne « Rendez-vous » **seulement si** `rdv_date`
est renseignée (`rdvLine` vaut la chaîne vide sinon). Un pied de page rappelle qu'il
s'agit d'un projet éducatif sans transaction réelle.

**Objet** : `Votre réservation est confirmée — {Brand} {Model}`
