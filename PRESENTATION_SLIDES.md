# Prompt pour Claude Sonnet — Slides de soutenance Eclipse Auto v2

> **Instruction :** Génère une présentation de soutenance scolaire en français, slide par slide.
> Design : thème sombre (fond `#0a0a0a`, accent rouge `#e8000d`, texte blanc), police moderne (Inter/Montserrat).
> Style aéré : **maximum 3 bullet points par slide**, grands espaces, une idée forte par slide.
> Format : 15 slides environ. Présente chaque slide clairement avec titre + contenu.

---

## Slide 1 — Page de garde

**Titre principal :** Eclipse Auto v2

**Sous-titre :** Application web de vente et gestion de véhicules

**Auteur :** Théo Ferreté

*(visuel suggéré : fond sombre, logo lettré, ligne rouge en bas)*

---

## Slide 2 — Le projet en une phrase

**Titre :** Eclipse Auto, c'est quoi ?

**Accroche centrale (grande, centrée) :**
> Une plateforme web complète pour parcourir, réserver et gérer des véhicules — côté client comme côté admin.

**3 mots-clés visuels (icônes) :**
- Catalogue
- Réservation
- Administration

---

## Slide 3 — Stack technique

**Titre :** Technologies

**Visuel : 2 colonnes**

| Frontend | Backend |
|---|---|
| React 19 | Node.js + Express 5 |
| Vite 8 | Supabase (PostgreSQL) |
| React Router v7 | Nodemailer |
| Chart.js | Jest + Supertest |

---

## Slide 4 — Architecture

**Titre :** Comment ça s'articule ?

**Schéma simple (3 blocs verticaux) :**

```
   [ React — Vite ]
         │
    Bearer Token (JWT)
         │
   [ API Express ]
    Middleware auth
         │
   [ Supabase / PostgreSQL ]
```

**Message clé sous le schéma :**
> Aucune requête sensible ne part directement du client vers la base de données.

---

## Slide 5 — Parcours utilisateur : la Home

**Titre :** Page d'accueil

**Ce que l'utilisateur voit :**
- Hero section avec appel à l'action
- Accès direct au catalogue
- Navigation : Login / Register / Dashboard

*(visuel suggéré : screenshot ou maquette de la Home)*

---

## Slide 6 — Parcours utilisateur : le Catalogue

**Titre :** Catalogue de véhicules

**3 fonctionnalités clés :**
- Filtres par marque, statut, fourchette de prix
- Tri et recherche textuelle en temps réel
- Pagination — navigation fluide

**Particularité :**
> Les filtres sont encodés dans l'URL (`?brand=BMW&sort=price_asc`) — le lien est partageable.

---

## Slide 7 — Parcours utilisateur : la Fiche véhicule

**Titre :** Détail d'un véhicule

**Ce que l'utilisateur trouve :**
- Photos, caractéristiques, prix
- Statut du véhicule (disponible / réservé / vendu)
- Bouton "Réserver" si disponible

---

## Slide 8 — Parcours utilisateur : la Réservation

**Titre :** Réserver un véhicule

**Le flux en 3 étapes :**
1. L'utilisateur remplit le formulaire (date de RDV, message)
2. La requête part vers `POST /api/reservations` avec son JWT
3. Le serveur enregistre la réservation — l'identité est vérifiée côté serveur

**Point sécurité :**
> Le `client_id` n'est jamais envoyé depuis le navigateur — il est extrait du token JWT.

---

## Slide 9 — Authentification

**Titre :** Gestion des comptes

**Ce qui est couvert :**
- Inscription (`/register`)
- Connexion (`/login`)
- Mot de passe oublié + réinitialisation par email
- Routes protégées via `<ProtectedRoute />`

**Technologie :** Supabase Auth + JWT — le token est joint à chaque requête API.

---

## Slide 10 — Espace client

**Titre :** Dashboard client

**2 sections :**
- **Profil** — informations personnelles
- **Mes réservations** — liste avec statut, possibilité d'annuler

**Email reçu automatiquement** quand une réservation est confirmée par un admin.

---

## Slide 11 — Espace admin : vue d'ensemble

**Titre :** Dashboard administrateur

**4 KPIs affichés en temps réel :**
- Total véhicules
- Total réservations
- Réservations confirmées
- Nombre de clients

**2 graphiques (Chart.js) :**
- Doughnut — répartition des statuts véhicules
- Bar — répartition des statuts réservations

---

## Slide 12 — Espace admin : gestion

**Titre :** Ce que l'admin peut faire

**4 modules :**
- Gérer les fiches véhicules (ajout, modification, suppression)
- Valider ou refuser des réservations
- Voir et gérer les comptes clients
- Supprimer un client (suppression complète : auth + profil en cascade)

---

## Slide 13 — Sécurité

**Titre :** Sécurité — avant / après

**Avant :**
> Le client appelait Supabase directement — n'importe qui pouvait forger une requête.

**Après :**
- Toutes les mutations passent par l'API Express
- JWT vérifié par un middleware sur chaque route protégée
- Données dans les emails échappées (`escapeHtml`) pour prévenir les injections
- Headers HTTP sécurisés via `helmet`

---

## Slide 14 — Tests automatisés

**Titre :** Tests d'intégration

**Ce qui est testé :**
- Routes API : véhicules, réservations, admin, contact
- Middleware d'authentification JWT
- Templates d'emails
- Gestion des erreurs

**Stack :** Jest + Supertest — les tests tournent sans démarrer le vrai serveur ni toucher la BDD.

---

## Slide 15 — Bilan

**Titre :** Ce que ce projet m'a apporté

**3 acquis :**
- Concevoir et sécuriser une architecture full-stack réelle
- Séparer les responsabilités client / serveur / base de données
- Livrer une application testée, fonctionnelle et présentable

**Une phrase de conclusion (grande, centrée) :**
> Eclipse Auto v2 — du parcours utilisateur à la sécurité API, une application pensée de bout en bout.

---

*Fin du contenu. Génère maintenant les slides avec le design décrit.*
