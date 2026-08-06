# Le socle — ce que tu dois savoir dire

> Ton deck contient **58 notions techniques**. C'est ça, le problème des repères : personne
> n'en tient 58 en tête pendant 35 minutes. Ce document en garde **14**. Le reste est
> mentionné au passage ou sorti.

## Comment lire ce document

Chaque notion du socle a deux niveaux :

- **N1 — ce que tu dis.** Une ou deux phrases, **zéro mot technique**, et juste quand même.
  C'est la seule chose à apprendre. Si tu ne retiens que les N1, ta soutenance tient debout.
- **N2 — ton filet.** À sortir uniquement si le jury creuse. Tu ne le récites pas, tu l'as en réserve.

Règle de survie : **si tu hésites, reste au N1.** Un N1 dit calmement vaut mieux qu'un N2
récité de travers. Le jury ne t'en voudra pas d'attendre sa question pour aller plus loin.

---

# PILE 1 — Le socle (14 notions)

## 1. Le besoin et les trois acteurs · CP1

**N1 —** « Eclipse Auto, c'est une concession de voitures de sport et de luxe. Aujourd'hui tout
passe par téléphone et par mail : le client ne sait pas ce qui est encore disponible, et la
concession ressaisit tout à la main. J'ai fait un site où le catalogue est à jour en permanence,
où le client réserve en ligne, et où la concession gère tout depuis un seul écran. »

**N2 —** « J'ai travaillé à partir de trois profils. Lucas regarde et compare sans vouloir acheter
tout de suite. Camille veut réserver vite et suivre où en est sa demande. Théo gère le parc et
les demandes. Chaque fonctionnalité que j'ai développée répond au besoin d'un des trois. »

> C'est ta base. Zéro technique, et c'est exactement ce que le jury blanc te réclamait.
> **Commence par là et ne l'expédie pas.**

## 2. Dessiner avant de coder · CP1

*Étiquette : Figma, wireframe, maquette*

**N1 —** « J'ai dessiné toutes les pages avant d'écrire une seule ligne de code. D'abord en gris,
juste pour placer les blocs et vérifier que le parcours tient debout. Ensuite en couleur, avec la
vraie identité visuelle. Mon formateur a validé avant que je commence à coder. »

**N2 —** « Le premier jet est volontairement sans couleur : ça évite de discuter esthétique alors
qu'on parle encore de structure. La version finale est cliquable, on peut naviguer dedans comme
dans le vrai site. Elle fixe la charte : noir, rouge, cyan, et deux polices. »

## 3. Le plan de la base · CP5

*Étiquette : MCD, méthode MERISE*

**N1 —** « Avant de créer la base, j'en ai fait le plan. J'ai quatre choses à stocker : les clients,
les voitures, les réservations et les options. Et je les relie : un client peut faire plusieurs
réservations, une réservation ne porte que sur une seule voiture, et une réservation peut
comporter plusieurs options. »

**N2 —** « Les chiffres autour des liens disent combien de fois une chose peut être reliée à
l'autre. Côté client, "de zéro à plusieurs réservations". Côté voiture, "exactement une". Le lien
entre réservation et options est un "plusieurs à plusieurs" : une réservation a plusieurs options,
et une option se retrouve sur plusieurs réservations. Ça ne rentre pas dans une colonne, donc ça
crée une table intermédiaire. »

> **Question quasi certaine : « pourquoi une table intermédiaire ? »**
> → « Parce que le lien va dans les deux sens. Je ne peux pas mettre plusieurs options dans une
> case, ni répéter la réservation autant de fois qu'elle a d'options. La table du milieu note
> juste les paires. »

## 4. Pourquoi une base relationnelle · CP5 · CP6

*Étiquette : SQL, PostgreSQL, transactions*

**N1 —** « Mes données sont pleines de liens : un client, ses réservations, et la voiture de chaque
réservation. Une base relationnelle est faite exactement pour ça. Et une réservation, pour moi,
c'est tout ou rien — je ne veux pas qu'elle puisse être enregistrée à moitié. »

**N2 —** « L'autre famille de bases stocke des documents indépendants, ce qui est pratique quand
la structure change souvent. Ici ma structure est stable et les liens sont partout. Et quand
j'enregistre une réservation j'écris dans deux tables d'affilée : il me faut la garantie que soit
les deux passent, soit aucune. »

> **Question quasi certaine : « et MongoDB, ça n'aurait pas marché ? »**
> → Réponds honnêtement, c'est ce qui marque des points : « Ça aurait pu marcher, mais j'aurais dû
> gérer tous les liens à la main. Pour des journaux d'activité ou des notifications, je le
> choisirais sans hésiter. »

## 5. La fiche client se crée toute seule · CP5

*Étiquette : trigger PostgreSQL*

**N1 —** « Quand quelqu'un s'inscrit, la base crée sa fiche client automatiquement. Je n'ai aucun
code à écrire pour ça, donc je ne peux pas oublier de le faire. »

**N2 —** « C'est un déclencheur : une petite fonction que la base exécute d'elle-même à chaque
inscription. Elle recopie l'identifiant du compte dans ma table des profils. Comme c'est la base
qui s'en charge, les deux ne peuvent pas se désynchroniser. J'en ai un deuxième qui met à jour le
statut de la voiture quand une réservation change d'état. »

## 6. La base est fermée à clé · CP5 · CP8

*Étiquette : Row Level Security*

**N1 —** « Ma base refuse tout par défaut. Même quelqu'un qui récupère la clé publique de mon site
ne peut rien en lire. Seul mon serveur a le passe. »

**N2 —** « Je n'ai écrit aucune règle d'autorisation, et dans ce système ça veut dire tout refuser.
Mon serveur utilise une clé de service qui passe outre, et cette clé est dans un fichier de
configuration sur le serveur — jamais dans le navigateur. La seule chose accessible avec la clé
publique, c'est le catalogue, et il est public de toute façon. »

## 7. Le navigateur ne touche jamais la base · CP6 ★

*Étiquette : API REST*

**N1 —** « Le site que tu vois dans le navigateur ne parle jamais directement à la base de données.
Il demande tout à mon serveur, et c'est mon serveur qui décide s'il répond. C'est un guichet : on
n'entre pas dans les archives, on demande au guichetier. »

**N2 —** « Le navigateur envoie une demande à une adresse, avec un mot qui dit ce qu'il veut faire :
lire, créer, modifier ou supprimer. Le serveur vérifie qui demande et ce qu'il a le droit de faire,
puis répond. L'intérêt, c'est que tout passe par ce point unique : je n'ai qu'un seul endroit à
sécuriser. »

> **C'est ton idée maîtresse.** Si le jury ne devait retenir qu'une phrase de toute ta partie
> technique, c'est celle-là. Elle explique à elle seule pourquoi ton application est sûre.

## 8. Le serveur rangé en trois · CP6 · CP7

*Étiquette : architecture MVC — routes, controllers, models*

**N1 —** « J'ai rangé mon serveur en trois dossiers. Le premier reçoit l'adresse demandée et oriente
vers le bon endroit. Le deuxième décide : il vérifie que la demande est valide et applique les
règles. Le troisième va chercher les données. Un standard téléphonique, un responsable, un
archiviste. »

**N2 —** « L'intérêt est double. Quand quelque chose ne marche pas, je sais dans lequel des trois
regarder. Et je peux tester celui qui décide sans avoir besoin d'une vraie base derrière. »

## 9. Le bracelet de festival · CP8

*Étiquette : JWT*

**N1 —** « Quand tu te connectes, tu reçois un bracelet. Il dit qui tu es et jusqu'à quand il est
valable, et on ne peut pas le fabriquer soi-même. À chaque demande, tu le montres. Mon serveur
regarde le bracelet et ça lui suffit — il n'a pas besoin d'aller vérifier dans un registre. »

**N2 —** « C'est un jeton signé par le serveur. Il contient mon identifiant, mon rôle et une date
d'expiration. N'importe qui peut le lire, donc je ne mets rien de secret dedans — mais personne ne
peut en fabriquer un valide sans la clé du serveur. Je le garde en mémoire dans l'application
plutôt que dans le stockage du navigateur, pour limiter les dégâts si un script malveillant
arrivait à s'exécuter. »

## 10. Trois portes · CP8

*Étiquette : contrôle d'accès par rôle*

**N1 —** « Il y a trois niveaux d'accès. Le catalogue est ouvert à tout le monde. Réserver demande
d'être connecté. Le back-office demande d'être administrateur. Et c'est toujours le serveur qui
vérifie — cacher un bouton dans le navigateur, ça n'a jamais protégé personne. »

**N2 —** « J'ai deux gardiens à l'entrée des routes. Le premier refuse si le bracelet est absent ou
invalide. Le second refuse en plus si le rôle n'est pas administrateur. Le point important, c'est
que le rôle est rangé dans une partie du jeton que le client ne peut pas modifier. J'ai bien un
rôle dans ma table des profils, mais il ne sert qu'à afficher ou masquer le lien Admin à l'écran —
jamais à autoriser quoi que ce soit. »

> Cette distinction — *le navigateur pour le confort, le serveur pour la sécurité* — est
> exactement ce qu'un jury cherche à entendre. Elle vaut plus que dix termes techniques.

## 11. Ce que j'ai protégé, et comment · CP8

Quatre menaces, chacune en une phrase concrète suivie de ta parade. **Ne récite jamais les
définitions** — décris ce qu'un attaquant essaierait de faire.

| Ce que quelqu'un essaierait | Ta réponse (N1) |
|---|---|
| Changer un numéro dans l'adresse pour voir la réservation de quelqu'un d'autre | « Je ne fais jamais confiance à l'identifiant envoyé par le navigateur. Je prends celui qui est dans le bracelet. Et avant d'annuler une réservation, je vérifie qu'elle appartient bien à la personne qui demande. » |
| Taper du code dans un formulaire pour qu'il s'exécute chez les autres visiteurs | « Tout ce que j'affiche est neutralisé automatiquement. Et pour les e-mails que j'envoie, comme ils sortent de ce cadre, j'ai écrit ma propre fonction pour neutraliser le texte. » |
| Trafiquer une demande pour qu'elle atteigne la base directement | « Je ne colle jamais du texte tapé par l'utilisateur dans une requête. Les valeurs passent par un canal séparé, elles ne peuvent pas être prises pour des instructions. » |
| Spammer mon formulaire de contact | « Je limite le nombre d'envois par adresse sur une durée donnée. » |

**N2 (si on creuse) —** « J'ai aussi une liste d'en-têtes de sécurité qui disent au navigateur ce
qu'il a le droit de charger, et je restreins les sites autorisés à appeler mon API en production.
Sur la limitation d'envois, j'ai fait attention à un détail : l'adresse du visiteur peut être
falsifiée si on fait aveuglément confiance à un en-tête. Chez moi cette confiance est désactivée
par défaut. »

## 12. Pourquoi j'ai écrit des tests · CP7

*Étiquette : tests automatisés, intégration continue*

**N1 —** « J'ai écrit une centaine de petits programmes qui vérifient mon application à ma place. Ils
tournent tous en quelques secondes. C'est ce qui m'a permis de réorganiser complètement mon
catalogue sans avoir peur de tout casser — sans eux, je n'y aurais pas touché. Et à chaque fois que
j'envoie mon code, tout se relance tout seul : si quelque chose casse, je le sais avant la mise en
ligne. »

**N2 —** « 64 côté serveur, 37 côté navigateur. Deux familles : ceux qui vérifient une fonction
isolée, et ceux qui envoient une vraie demande à mon serveur pour contrôler sa réponse. J'ai aussi
verrouillé un seuil : si la part de mon code couverte par les tests descend sous un certain niveau,
la mise en ligne est bloquée automatiquement. »

> ⚠ Confirme les chiffres par un `npm test` avant l'oral. Ils sont comptés dans les fichiers,
> pas mesurés.

## 13. Où ça tourne · CP7

*Étiquette : VPS, Apache, PM2*

**N1 —** « Le site tourne sur un serveur que je loue. Un premier programme reçoit les visiteurs et
leur sert les pages. Un deuxième garde mon serveur allumé en permanence — s'il plante, il le
rallume tout seul. »

**N2 —** « Le programme de façade gère aussi le certificat qui met le site en HTTPS. Il sert les
fichiers du site, et quand la demande concerne l'API il la transmet à mon serveur qui tourne sur un
port interne, invisible de l'extérieur. »

> **Question piège fréquente : « que se passe-t-il si je tape directement l'adresse du catalogue ? »**
> → « Il faut une règle qui renvoie toujours la page principale, sinon le serveur cherche un dossier
> qui n'existe pas et affiche une erreur. C'est justement un des problèmes sur lesquels j'ai buté. »

## 14. Le même site sur téléphone · CP2

*Étiquette : responsive, points de rupture*

**N1 —** « C'est le même site partout. À partir d'une certaine largeur d'écran, les colonnes se
replient les unes sous les autres et le menu se transforme en bouton. »

**N2 —** « J'ai trois seuils, autour de 480, 768 et 1024 pixels. Je l'ai fait en CSS classique, sans
bibliothèque : je voulais comprendre ce que j'écrivais plutôt que d'empiler des classes toutes
faites. »

---

# PILE 2 — Mention au passage

Ces éléments **existent**, tu peux les nommer en une demi-phrase, mais tu ne les développes
**jamais** spontanément. Aucune slide ne leur est consacrée.

React · Vite · Express · Supabase · les 17 pages du site · le catalogue mis en cache quelques
minutes · la mise à jour du catalogue en direct · les deux graphiques du tableau de bord ·
l'envoi d'e-mails · ClickUp et les 13 récits utilisateurs · la charte graphique · le certificat
HTTPS · l'écran de repli quand une page plante

> Formulation type : « Côté outils, j'ai utilisé React pour l'interface et Express pour le
> serveur. » Point. On enchaîne.

---

# PILE 3 — À sortir des slides

**Ne figure sur aucune slide, pas même en annexe.** Si le jury pose la question, la réponse est
dans ton N2 — mais rien à l'écran ne doit l'inviter.

CommonJS contre ESM · le script SQL complet · les types énumérés · les colonnes tableau · la clé
primaire composite · le choix entre identifiant numérique et identifiant long · les noms des cinq
hooks React · la transmission de propriétés en cascade · la mémorisation de calcul · la
synchronisation des filtres avec l'adresse · les codes de réponse 401 / 403 / 409 / 500 · la
composition du jeton en trois parties · l'algorithme de signature · le stockage navigateur · les
noms des bibliothèques de test · la simulation de la base dans les tests · la pyramide des tests ·
le tableau comparatif des deux familles de bases · les noms des middlewares · le numéro de port ·
les directives du serveur web · les huit compteurs du tableau de bord

**Pourquoi les sortir :** chacun de ces éléments est une invitation à une question que tu ne
souhaites pas. Les garder ne prouve rien — le jury évalue ce que tu **sais dire**, pas ce que tu
sais afficher.

**Exception à garder :** le découpage du serveur en deux fichiers pour rendre les tests possibles.
Ce n'est pas une notion à exposer, c'est une **histoire à raconter** — elle a sa place dans
« difficultés rencontrées », et elle se raconte très bien :

> « Mes tests n'arrivaient pas à démarrer parce que le serveur voulait occuper une vraie prise
> réseau, et ils se marchaient dessus. J'ai coupé en deux : d'un côté ce que le serveur sait faire,
> de l'autre le fait de l'allumer. Les tests utilisent le premier sans allumer le second. »

---

# Les trois réflexes pour le jour J

1. **Commence toujours par le N1.** Tu montes au N2 seulement si on te le demande. Le silence
   après une réponse courte n'est pas un vide à combler — c'est au jury de relancer.
2. **Si tu ne sais pas, dis-le et propose.** « Je ne l'ai pas implémenté, mais si je devais le
   faire je partirais sur… » vaut infiniment mieux qu'une improvisation. Un jury sanctionne le
   bluff, pas l'honnêteté.
3. **Ramène tout au besoin.** Chaque fois que tu te sens partir dans le technique, reviens à
   Lucas, Camille ou Théo : « concrètement, pour Camille, ça veut dire que… ». C'est ton fil,
   et c'est précisément ce que le jury blanc te demandait.
