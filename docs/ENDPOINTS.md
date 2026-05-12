# Eclipse Auto — Documentation API

Base URL : `http://localhost:3001/api` (dev) | `https://ton-domaine.fr/api` (prod)

---

## Authentification

Toutes les routes protégées nécessitent un header :

```
Authorization: Bearer <supabase_access_token>
```

Les tokens sont émis par Supabase Auth lors du login.

---

## Véhicules

### `GET /vehicles`
Liste paginée des véhicules.

**Query params**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `limit` | number | 50 | Résultats par page (max 100) |
| `offset` | number | 0 | Décalage pour la pagination |
| `status` | string | — | Filtre : `available`, `reserved`, `sold` |
| `brand` | string | — | Filtre par marque |
| `fuel_type` | string | — | Filtre par carburant |

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2022,
      "price": 25000,
      "fuel_type": "essence",
      "transmission": "automatique",
      "mileage": 15000,
      "power": "132ch",
      "status": "available",
      "images": ["https://..."],
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

### `GET /vehicles/by-slug/:slug`
Détail d'un véhicule par son slug (brand-model normalisé).

**Exemple** : `GET /vehicles/by-slug/toyota-corolla`

**Réponse 200** : objet véhicule complet  
**Réponse 404** : `{ "error": "Véhicule introuvable." }`

---

### `GET /vehicles/:id`
Détail d'un véhicule par son UUID.

**Réponse 200** : objet véhicule complet  
**Réponse 404** : `{ "error": "Véhicule introuvable." }`

---

### `POST /vehicles` 🔒 Admin
Créer un véhicule.

**Body**
```json
{
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2022,
  "price": 25000,
  "fuel_type": "essence",
  "transmission": "automatique",
  "mileage": 15000,
  "power": "132ch",
  "description": "Très bon état",
  "status": "available"
}
```

**Validations**
- `year` : 1900 — année courante + 1
- `price` : >= 0
- `mileage` : >= 0

**Réponse 201** : véhicule créé  
**Réponse 400** : `{ "error": "Année invalide..." }` | `{ "error": "Champs obligatoires manquants." }`  
**Réponse 401/403** : non authentifié / non admin

---

### `PUT /vehicles/:id` 🔒 Admin
Modifier un véhicule existant. Mêmes body et validations que POST.

**Réponse 200** : véhicule mis à jour

---

### `DELETE /vehicles/:id` 🔒 Admin
Supprimer un véhicule.

**Réponse 200** : `{ "success": true }`

---

## Réservations

### `GET /reservations` 🔒 Auth
Réservations de l'utilisateur connecté.

**Réponse 200**
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "vehicle_id": "uuid",
    "status": "pending",
    "message": "Je suis disponible le mardi",
    "rdv_date": "2026-06-01",
    "created_at": "2026-01-01T00:00:00Z",
    "vehicles": { "brand": "Toyota", "model": "Corolla", "price": 25000 }
  }
]
```

---

### `GET /reservations/all` 🔒 Admin
Toutes les réservations avec pagination.

**Query params** : `limit`, `offset`, `status` (`pending`, `confirmed`, `cancelled`)

**Réponse 200**
```json
{
  "data": [...],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

---

### `POST /reservations` 🔒 Auth
Créer une réservation.

**Body**
```json
{
  "vehicle_id": "uuid",
  "message": "Je souhaite un rendez-vous en semaine",
  "rdv_date": "2026-06-01"
}
```

**Réponse 201** : réservation créée  
**Réponse 400** : `{ "error": "vehicle_id obligatoire." }`  
**Réponse 409** : `{ "error": "Ce véhicule n'est plus disponible." }`

---

### `PATCH /reservations/:id/status` 🔒 Admin
Changer le statut d'une réservation.

**Body** : `{ "status": "confirmed" }` | `"pending"` | `"cancelled"`

**Réponse 200** : réservation mise à jour  
**Réponse 400** : `{ "error": "Statut invalide." }`

---

### `PATCH /reservations/:id/cancel` 🔒 Auth
Annuler sa propre réservation (statut `pending` uniquement).

**Réponse 200** : réservation annulée  
**Réponse 400** : `{ "error": "Seules les réservations en attente peuvent être annulées." }`  
**Réponse 403** : `{ "error": "Accès refusé." }` (pas la bonne réservation)

---

## Admin

### `GET /admin/stats` 🔒 Admin
Statistiques du tableau de bord.

**Réponse 200**
```json
{
  "vehicles": { "total": 42, "available": 30, "reserved": 8, "sold": 4 },
  "reservations": { "total": 15, "pending": 5, "confirmed": 10 },
  "clients": 87
}
```

---

### `GET /admin/clients` 🔒 Admin
Liste paginée des clients.

**Query params** : `limit`, `offset`

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "email": "...", "role": "client", "created_at": "..." }
  ],
  "total": 87,
  "limit": 50,
  "offset": 0
}
```

---

### `DELETE /admin/clients/:id` 🔒 Admin
Supprimer un compte client.

**Réponse 200** : `{ "success": true }`

---

## Contact

### `POST /contact`
Envoyer un message de contact (rate limit : 5 req / 15 min / IP).

**Body**
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "0601020304",
  "subject": "Question sur un véhicule",
  "message": "Bonjour..."
}
```

**Validations**
- `name`, `email`, `message` : obligatoires
- `email` : format valide requis
- `name` : max 100 caractères
- `message` : max 5000 caractères

**Réponse 200** : `{ "success": true, "message": "Message envoyé." }`  
**Réponse 400** : champ manquant ou invalide  
**Réponse 429** : `{ "error": "Trop de requêtes. Réessayez dans 15 minutes." }`

---

## Codes d'erreur globaux

| Code | Signification |
|------|--------------|
| 400 | Données invalides ou manquantes |
| 401 | Token absent ou expiré |
| 403 | Accès refusé (rôle insuffisant) |
| 404 | Ressource introuvable |
| 429 | Trop de requêtes |
| 500 | Erreur serveur interne |
