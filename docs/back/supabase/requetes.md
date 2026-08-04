← [Supabase](README.md)

# Les requêtes : de la librairie JS au SQL

## La librairie n'est qu'un traducteur SQL → HTTP

Quand tu écris dans `models/vehicleModel.js` :

```js
supabase.from('vehicles').select('*').eq('id', id).single()
```

Il ne se passe rien de magique. La librairie construit une URL et l'appelle :

```http
GET https://<projet>.supabase.co/rest/v1/vehicles?id=eq.<id>&select=*
Authorization: Bearer <clé>
Accept: application/vnd.pgrst.object+json      ← c'est ça, .single()
```

Côté Supabase, **PostgREST** traduit cette URL en `SELECT * FROM vehicles WHERE id = ...`.

Le tableau de correspondance à connaître pour l'oral :

| Méthode JS | Équivalent SQL |
|---|---|
| `.from('vehicles')` | `FROM vehicles` |
| `.select('*')` | `SELECT *` |
| `.eq('status', 'available')` | `WHERE status = 'available'` |
| `.in('id', ids)` | `WHERE id IN (...)` |
| `.order('created_at', { ascending: false })` | `ORDER BY created_at DESC` |
| `.range(0, 49)` | `LIMIT 50 OFFSET 0` |
| `.single()` | Attend exactement 1 ligne, sinon erreur |
| `.insert(obj)` | `INSERT INTO ...` |
| `.update(obj).eq('id', id)` | `UPDATE ... WHERE id = ...` |
| `.delete().eq('id', id)` | `DELETE FROM ... WHERE id = ...` |
| `.select('*', { count: 'exact', head: true })` | `SELECT COUNT(*)` sans ramener les lignes |

**Point important** : chaque appel retourne toujours un objet `{ data, error }`. La librairie
ne lève pas d'exception sur une erreur SQL — elle la met dans `error`. C'est pour ça que
tout le code du projet ressemble à :

```js
const { data, error } = await vehicleModel.findAll(...)
if (error) return res.status(500).json({ error: error.message })
```

## Les jointures : l'« embed » PostgREST

C'est la syntaxe la plus déroutante du projet. Dans `models/reservationModel.js` :

```js
.select('*, vehicles(brand, model, images, price), reservation_equipements(equipements(id, nom, prix_supplement))')
```

Ça veut dire : « prends toutes les colonnes de `reservations`, et **en plus**, pour chaque
ligne, va chercher le véhicule lié et les équipements liés ». PostgREST le fait en une
seule requête et renvoie du JSON imbriqué :

```json
{
  "id": "...", "status": "pending",
  "vehicles": { "brand": "BMW", "model": "M5", "price": 90000 },
  "reservation_equipements": [ { "equipements": { "id": "...", "nom": "GPS" } } ]
}
```

Le contrôleur aplatit ensuite `reservation_equipements` en un simple tableau `equipements`
(fonction `formatReservationEquipements` dans `reservationController.js`).

**Condition indispensable** : l'embed ne fonctionne que s'il existe une **clé étrangère**
entre les deux tables. PostgREST lit les contraintes du schéma pour savoir comment joindre.

### La conséquence à connaître par cœur pour l'oral

Il n'existe **aucune clé étrangère `reservations.client_id → profiles.id`** — la colonne
`client_id` référence `auth.users`, pas `profiles`. Donc `select('*, profiles(...)')` sur
`reservations` **échoue**. C'est pour ça que le nom du client est résolu en **deux requêtes**,
dans la fonction `withClientNames()` de `reservationController.js` :

1. récupérer les réservations,
2. faire un seul `SELECT ... FROM profiles WHERE id IN (liste des client_id distincts)`,
3. recoller les noms côté JavaScript avec une `Map`.

Une requête groupée, pas une par réservation : c'est ce qui évite le problème classique
du « N+1 ».

Voir [schema.md](schema.md) pour le détail des relations.
