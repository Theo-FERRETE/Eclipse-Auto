← [Front](../README.md)

# Architecture et conventions

| Page | Contenu |
|---|---|
| **Cette page** | Conventions du projet, structure des dossiers |
| [routing.md](routing.md) | `App.jsx`, les 18 routes, le slug, la structure enveloppante |
| [performance.md](performance.md) | Code splitting, chunks, images, dev vs prod, variables d'env |

---

## Conventions du projet

**Un dossier par composant, le CSS à côté.**
`components/Navbar/Navbar.jsx` + `components/Navbar/Navbar.css`.
Le CSS est importé dans le `.jsx` (`import './Navbar.css'`). Certains petits composants
n'ont pas de CSS propre et s'appuient sur `index.css`.

**Alias `@` = `client/src/`.**
`import Navbar from '@/components/Navbar/Navbar'` — pas de `../../../`. Défini deux fois :
dans `vite.config.js` (pour le build **et** pour Vitest) et dans `jsconfig.json` (pour l'IDE).

**Un export par défaut par fichier**, nommé comme le fichier.

**`page` vs `component`** : si c'est une URL du site, ça va dans `pages/`. Sinon dans
`components/`.

## Les trois dossiers de `src/`

| Dossier | Rôle |
|---|---|
| `lib/` | Code partagé sans JSX : client Supabase, auth, cache, helpers, constantes |
| `pages/` | Un dossier par écran du site. Les 5 écrans d'administration sont regroupés dans `pages/admin/` |
| `components/` | Tout ce qui est réutilisé ou extrait d'une page pour l'alléger |

Les composants suivent un préfixe par famille, ce qui les regroupe visuellement dans
l'explorateur de fichiers :

- `Dashboard*` — Sidebar, Reservations, Profile
- `Reservation*` — Breadcrumb, VehiclePanel, Form, Success
- `Admin*` — Sidebar, PageHeader, VehicleCard, VehicleModal, Charts

## Commandes

```bash
cd client
npm run dev       # serveur Vite sur http://localhost:5173
npm run build     # build de production dans client/dist
npm run preview   # prévisualise le build
npm test          # vitest run  (37 tests)
npm run lint      # eslint
```
