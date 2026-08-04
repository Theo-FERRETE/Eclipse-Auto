← [Front](../README.md)

# Front — d'où viennent les données

C'est **le** point qui peut perdre à la lecture du code : le front a deux façons d'obtenir
des données. Elles coexistent volontairement, mais il faut savoir laquelle s'applique où.

| Page | Contenu |
|---|---|
| **Cette page** | La règle API vs Supabase, le motif d'appel, la carte des appels |
| [cache.md](cache.md) | Le cache véhicules partagé entre les pages |
| [realtime.md](realtime.md) | La mise à jour en direct du catalogue |
| [filtres-url.md](filtres-url.md) | Les filtres du catalogue dans l'URL |
| [doublons.md](doublons.md) | Deux doublons de constantes à connaître |

---

## La règle

> **Ce qui est public ou qui ne concerne que moi → Supabase en direct.
> Ce qui concerne les autres ou qui doit être contrôlé → l'API Express.**

```text
┌─ Supabase en direct (clé anon) ─────────────┐   ┌─ API Express (JWT Bearer) ───────────┐
│                                             │   │                                      │
│  • Connexion / inscription / session        │   │  • Créer, annuler une réservation    │
│  • Lecture du catalogue (public)            │   │  • Lister SES réservations           │
│  • Realtime sur le catalogue                │   │  • Toutes les actions admin          │
│  • Lecture + écriture de SON profil         │   │  • Le formulaire de contact          │
│  • Mot de passe oublié / réinitialisé       │   │  • Le catalogue d'équipements        │
└─────────────────────────────────────────────┘   └──────────────────────────────────────┘
```

Chiffre à retenir pour l'oral : il ne reste que **5 appels `.from()` en direct** dans tout
le front (`vehicles` ×2, `profiles` ×3). Tout le reste passe par Express.

### Pourquoi ce partage, et pas « tout par l'API » ?

Faire transiter la lecture du catalogue par Express n'apporterait rien : c'est une donnée
publique, affichée telle quelle sur le site. Passer par un intermédiaire ajouterait une
latence et du code pour zéro gain de sécurité.

À l'inverse, tout ce qui touche à *qui a le droit de faire quoi* doit passer par le serveur,
seul endroit où l'identité peut être vérifiée de façon fiable
(voir [../../back/securite/README.md](../../back/securite/README.md)).

## Le motif d'appel à l'API

Il est identique partout — apprends-le, il revient une douzaine de fois :

```js
const { data: { session } } = await supabase.auth.getSession()
const res = await fetch('/api/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ ... }),
})
if (!res.ok) { /* gestion d'erreur */ }
const data = await res.json()
```

Trois choses à noter :

1. **`getSession()` à chaque fois.** On ne stocke pas le token dans un état React : la
   librairie Supabase le rafraîchit toute seule en arrière-plan, et le relire garantit de
   ne jamais envoyer un token expiré.
2. **Chemin relatif `/api/...`.** Résolu par le proxy Vite en dev, par Express en prod
   (voir [../architecture/performance.md](../architecture/performance.md)).
3. **`res.ok` est testé.** `fetch` ne lève pas d'exception sur une 4xx/5xx — sans ce test,
   une erreur passerait inaperçue.

## Carte des appels API par fichier

| Fichier | Appels |
|---|---|
| `pages/Reservation/Reservation.jsx` | `GET /api/equipements` · `POST /api/reservations` |
| `pages/Dashboard/Dashboard.jsx` | `GET /api/reservations` · `PATCH /api/reservations/:id/cancel` |
| `pages/Contact/Contact.jsx` | `POST /api/contact` |
| `pages/VehicleDetail/VehicleDetail.jsx` | `GET /api/equipements` |
| `pages/admin/AdminDashboard` | `GET /api/admin/stats` |
| `pages/admin/AdminUsers` | `GET /api/admin/clients` · `DELETE /api/admin/clients/:id` |
| `pages/admin/AdminVehicles` | `PUT` et `DELETE /api/vehicles/:id` |
| `pages/admin/AdminReservations` | `GET /api/reservations/all` · `PATCH /api/reservations/:id/status` |
| `pages/admin/AdminEquipements` | `GET /api/equipements` · `DELETE /api/equipements/:id` |
| `lib/vehiclesCache.js` | `GET /api/vehicles/by-slug/:slug` (en secours, cache froid) |
