# Soutenance — état des lieux et plan de refonte des slides

> Notes de travail du 4 août 2026. Point de reprise pour la refonte du `.pptx`.

## Le retour du jury blanc

Deux reproches, qui pointent la même cause :

1. **Trop de jargon, incompréhensible**
2. **Pas assez de fonctionnel / métier**

Cause identifiée : les slides sont rangées **comme le code** (Back-end / Front-end / Sécurité),
pas comme un récit. Chaque slide est un redémarrage à froid, rien n'appelle la suivante — d'où
le « je me perds dans mes explications ».

**Précision importante ajoutée ensuite :** ce n'est pas une zone technique en particulier qui
coince, c'est **l'ensemble**. Ses mots : « tout le monde trouve que j'ai pas de repères tellement
c'est technique ». Interrogé zone par zone — base de données, back-end, sécurité, React, tests,
déploiement — la réponse est « c'est pareil » partout. Il ne faut donc pas trier par zone :
il faut baisser le niveau technique global et lui fabriquer des repères.

## Les trois règles qui corrigent ça

**1. Chaque titre devient une question.**
Une étiquette ne peut que se réciter. Une question appelle une réponse, qu'on formule avec ses mots.

| Aujourd'hui (étiquette) | À la place (question) |
|---|---|
| « Architecture React : SPA + hooks + contexte » | « Comment l'interface reste-t-elle synchronisée ? » |
| « MLD 5 tables · PostgreSQL 15 · RLS · Triggers » | « Où sont rangées les données, et pourquoi comme ça ? » |
| « Comment j'ai sécurisé l'application » | « Qui a le droit de faire quoi ? » |

**2. Le problème concret d'abord, le mot technique en étiquette ensuite.**
Poser `RLS` ou `useMemo` en point de départ oblige à expliquer le terme *avant* l'idée :
deux niveaux empilés, et c'est là qu'on s'enfonce.

| Aujourd'hui | Ce qui se raconte tout seul |
|---|---|
| « Row Level Security : zéro policy = deny-all implicite » | « Même avec la clé publique du site, on ne peut rien lire de la base. » → *RLS* |
| « useSearchParams synchronise marque, statut, prix avec l'URL » | « Le client filtre, il colle le lien à un ami : les filtres sont là. » → *useSearchParams* |
| « app.js ≠ index.js pour les tests Supertest » | « J'ai dû couper mon serveur en deux pour pouvoir le tester. » → *app.js / index.js* |

**3. Deux niveaux pour chaque notion.**

- **Niveau 1 — ce qui sort de la bouche.** Une phrase, zéro mot technique, juste quand même.
  C'est la seule à apprendre.
- **Niveau 2 — le filet.** Deux phrases de plus, sorties uniquement si le jury creuse.

Exemple sur RLS :
> *N1 —* « La base est fermée à clé par défaut. Même quelqu'un qui récupère la clé publique de
> mon site ne peut rien en lire. Seul mon serveur a le passe. »
> *N2 —* « Je n'ai créé aucune policy, et sous PostgreSQL ça veut dire tout refuser. Express
> utilise une clé de service qui passe outre — elle est dans le `.env`, jamais dans le navigateur. »

**Critère de tri :** *une slide est une promesse*. Tout ce qui est affiché invite une question.
Ce qui ne se défend pas avec ses mots ne doit pas être projeté — pas même en annexe.

**Garde-fou :** on simplifie **l'expression, pas le fond**. Le jury doit valider CP5, CP6 et CP8 :
il creusera la base, l'API et la sécurité. Objectif = le dire en langage normal, pas en dire moins.

## ★ La ressource inutilisée : les personas

Le [cahier des charges](../cahier-des-charges.html) contient déjà tout le matériel métier qui manque
aux slides — il n'en a jamais été extrait :

- **Lucas, 28 ans** — Visiteur / passionné. Explorer et comparer sans acheter tout de suite.
  Frustrations : sites lents, filtres non pertinents, photos médiocres. Navigue au téléphone.
- **Camille, 34 ans** — Cliente / acheteuse. Réserver vite, suivre l'avancement de sa demande.
  Frustrations : processus de réservation trop long, pas de visibilité sur le statut. Desktop.
- **Théo, 27 ans** — Admin / gestionnaire. Gérer le parc et les demandes depuis une interface unique.
  Frustrations : outils dispersés, erreurs de mise à jour manuelle. Desktop, veut aller vite.

Plus une **matrice des droits d'accès** (12 fonctionnalités × 3 rôles) qui justifie visuellement
tout le volet autorisation.

C'est le fil narratif : les trois parcours structurent la partie fonctionnelle, et chaque brique
technique se rattache ensuite à un besoin nommé.

## Corrections factuelles à faire (vérifiées dans le repo)

| Slide(s) | Affiché | Réel |
|---|---|---|
| 11, 22, 25 | 56 tests serveur | **64** (8 suites) |
| 22 | 93 tests au total | **101** (64 + 37) |
| 22 | — | **Seuils de couverture verrouillés en CI** : `functions 95%`, `lines 95%`, `statements 90%`, `branches 78%` — argument qualité absent du deck |
| 16 | 14 routes React | **17** (9 publiques, 2 privées, 5 admin, 1 page 404) |

> À confirmer par un `npm test` dans `server/` et `client/` avant l'oral — Node n'est pas installé
> sur cette machine, les comptages ci-dessus viennent de la lecture des fichiers de test.

### Incohérence à corriger en priorité

La **numérotation des User Stories diffère** entre le dossier et les slides :

| | US-01 | US-02 | US-03 |
|---|---|---|---|
| Cahier des charges | Visiteur — parcourir le catalogue | Visiteur — filtrer | Visiteur — fiche véhicule |
| Slide 5 | Inscription | Connexion | Déconnexion |

Si le jury a le dossier de 67 pages ouvert pendant la projection, il voit deux référentiels
qui ne concordent pas.

## Structure cible : 24 slides + annexes

Budget 35 min. Le contenu technique ne disparaît pas — il passe **des slides à la bouche et aux annexes**.

```
ACTE 1 — LE BESOIN                                   4 min
  1  Titre
  2  Qui suis-je                        (allégé, 2 phrases)
  3  ★ À quoi sert Eclipse Auto ?       NOUVEAU — le besoin métier
  4  ★ Pour qui ?                       NOUVEAU — Lucas / Camille / Théo + matrice des droits

ACTE 2 — CE QUE ÇA FAIT                              7 min
  5  Intercalaire « Le produit »
  6  ★ Le parcours de Lucas             visiteur : catalogue, filtres, fiche
  7  ★ Le parcours de Camille           cliente : inscription, réservation, suivi
  8  ★ Le parcours de Théo              admin : back-office, statuts, stats
  9  Comment j'ai organisé le travail   ClickUp + US            (CP1)
 10  À quoi ça ressemblait avant        Figma wireframe→maquette (CP1)

ACTE 3 — COMMENT C'EST CONSTRUIT                    11 min
 11  Intercalaire « La construction »
 12  Avec quoi je l'ai construit ?      stack + justifications
 13  Où sont rangées les données ?      MCD                      (CP5)
 14  Du schéma à la vraie base ?        MLD + trigger + RLS      (CP5)
 15  Comment le site parle au serveur ? API REST + MVC       (CP6·CP7)
 16  Qui a le droit de faire quoi ?     JWT + rôles  FUSION 19+20 (CP8)
 17  Comment j'ai protégé l'appli ?     menace → MA parade — RÉÉCRITE (CP8)
 18  Comment l'écran s'adapte ?         responsive               (CP2)
 19  Trois choses dont je suis fier     React                (CP3·CP4)

ACTE 4 — LA PREUVE                                   4 min
 20  Intercalaire « La preuve »
 21  Comment je sais que ça marche ?    101 tests + couverture + CI (CP7)
 22  Comment c'est en ligne ?           VPS OVH                  (CP7)

DÉMO + CLÔTURE                                       9 min
 23  DÉMO LIVE                                        7 min
 24  Ce que j'en retiens + 8 CP + liens               2 min

ANNEXES (Q&A, jamais projetées sauf question)
 A1  Les 13 User Stories détaillées
 A2  MPD : script SQL complet
 A3  SQL vs NoSQL : tableau comparatif
 A4  Sécurité : définitions XSS / CSRF / IDOR / injection SQL
 A5  Les 5 hooks React expliqués
 A6  Veille technologique
 A7  Difficultés rencontrées & solutions
 A8  Améliorations possibles
```

## Ce qu'on garde tel quel

Ces slides sont bonnes, elles ne bougent pas : titre, Figma (wireframe → maquette),
3 fonctionnalités React, difficultés & solutions, leçons apprises, récap des 8 CP.

## État technique du fichier

- Original intact : `C:\Users\theof\Downloads\Slides-Eclipse-Auto.pptx` (29 slides, 549 Ko)
- Le `.pptx` contient déjà **29 notesSlides** avec un minutage (total ≈ 32 min) — à préserver et compléter
- Les **5 captures** sont dans l'archive (`ppt/media/image1-5.png`) : ClickUp, MCD, MLD, wireframe, maquette
- Ni Node ni Python sur la machine → la refonte se fera en **PowerShell natif**
  (un `.pptx` est un ZIP de XML), sur une copie, livré sous un nouveau nom

## Prochaine étape

Écrire la trame complète : pour chacune des 24 slides — le titre en question, le texte exact
à afficher (≈ 25 mots max), et le **script parlé mot pour mot** qui ira dans les notes du présentateur.
C'est le script qui règle le « je me perds », plus encore que les slides.
