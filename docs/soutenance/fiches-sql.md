# Fiches de révision — SQL (Eclipse Auto)

Retour vers [fiches-react.md](fiches-react.md) · [lexique.md](lexique.md)

Toutes les requêtes ci-dessous utilisent le **vrai schéma du projet** (Postgres/Supabase) pour que tu puisses répondre avec des exemples concrets si le jury demande "écris-moi une requête".

---

## Schéma de référence

```
vehicles (id, brand, model, year, price, fuel_type, transmission, mileage,
          power, description, status, images[], created_at)
  status ∈ {available, reserved, sold}

profiles (id, first_name, last_name, phone, role, created_at)
  id = auth.users.id (même UUID que le compte Supabase Auth)
  role ∈ {client, admin}

reservations (id, vehicle_id → vehicles.id, client_id → profiles.id,
              status, message, rdv_date, created_at)
  status ∈ {pending, confirmed, cancelled}

equipements (id, nom, categorie, prix_supplement, created_at)

reservation_equipements (reservation_id → reservations.id,
                          equipement_id → equipements.id)
  -- table associative (many-to-many entre reservations et equipements)
```

Retiens bien : `reservations` a **deux** clés étrangères (`vehicle_id`, `client_id`), et `reservation_equipements` est la table pivot classique many-to-many.

---

## 1. SELECT de base

```sql
SELECT brand, model, price FROM vehicles;

SELECT * FROM vehicles WHERE status = 'available';

SELECT brand, model, price
FROM vehicles
WHERE status = 'available' AND price < 30000
ORDER BY price ASC
LIMIT 10 OFFSET 0;          -- pagination : page 1, 10 résultats
```

- `ORDER BY col DESC` = décroissant.
- `LIMIT x OFFSET y` = pagination (le projet plafonne `limit` à 100 côté API).
- `SELECT DISTINCT brand FROM vehicles;` → marques uniques, sans doublons.

## 2. Filtres

| Opérateur | Exemple | Sens |
|---|---|---|
| `=`, `!=`/`<>`, `<`, `>`, `<=`, `>=` | `price > 20000` | comparaison |
| `AND` / `OR` / `NOT` | `status = 'available' AND price < 30000` | combinaison |
| `BETWEEN` | `price BETWEEN 10000 AND 30000` | intervalle inclusif |
| `IN` | `status IN ('reserved','sold')` | appartenance à une liste |
| `LIKE` / `ILIKE` | `model ILIKE '%golf%'` | motif texte (`ILIKE` = insensible à la casse, spécifique Postgres) |
| `IS NULL` / `IS NOT NULL` | `rdv_date IS NULL` | test de valeur nulle (jamais `= NULL`, ça ne matche rien) |

```sql
-- Véhicules diesel entre 15000€ et 25000€, triés du moins cher au plus cher
SELECT brand, model, price
FROM vehicles
WHERE fuel_type = 'diesel'
  AND price BETWEEN 15000 AND 25000
ORDER BY price;
```

## 3. Agrégations : COUNT / SUM / AVG / MIN / MAX + GROUP BY / HAVING

```sql
-- Nombre de véhicules par statut
SELECT status, COUNT(*) AS total
FROM vehicles
GROUP BY status;

-- Prix moyen par marque, uniquement les marques avec plus de 3 véhicules
SELECT brand, AVG(price) AS prix_moyen, COUNT(*) AS nb
FROM vehicles
GROUP BY brand
HAVING COUNT(*) > 3
ORDER BY prix_moyen DESC;
```

**Piège classique** : `WHERE` filtre les lignes *avant* le regroupement, `HAVING` filtre les groupes *après* `GROUP BY`. On ne peut pas mettre `COUNT(*) > 3` dans un `WHERE`.

```sql
-- Nombre de réservations par statut
SELECT status, COUNT(*) FROM reservations GROUP BY status;
```

## 4. Jointures (le morceau le plus probable à l'oral)

### INNER JOIN
Ne garde que les lignes qui matchent des deux côtés.

```sql
-- Réservations avec les infos du véhicule concerné
SELECT r.id, r.status, r.rdv_date, v.brand, v.model, v.price
FROM reservations r
JOIN vehicles v ON v.id = r.vehicle_id;
```

### LEFT JOIN
Garde **toutes** les lignes de la table de gauche, même sans correspondance à droite (colonnes à `NULL` sinon).

```sql
-- Tous les véhicules, avec le nombre de réservations (0 si aucune)
SELECT v.brand, v.model, COUNT(r.id) AS nb_reservations
FROM vehicles v
LEFT JOIN reservations r ON r.vehicle_id = v.id
GROUP BY v.id, v.brand, v.model
ORDER BY nb_reservations DESC;
```

Si on avait fait un `JOIN` simple ici, les véhicules **jamais réservés** auraient disparu du résultat — c'est la différence clé à savoir expliquer.

### Jointure à 3 tables (client + véhicule dans une réservation)

```sql
SELECT p.first_name, p.last_name, v.brand, v.model, r.status, r.rdv_date
FROM reservations r
JOIN profiles p ON p.id = r.client_id
JOIN vehicles v ON v.id = r.vehicle_id
WHERE r.status = 'confirmed'
ORDER BY r.rdv_date;
```

### Jointure via une table associative (many-to-many)

```sql
-- Liste des équipements choisis pour une réservation donnée
SELECT e.nom, e.prix_supplement
FROM reservation_equipements re
JOIN equipements e ON e.id = re.equipement_id
WHERE re.reservation_id = '<uuid-de-la-reservation>';

-- Total des suppléments par réservation
SELECT re.reservation_id, SUM(e.prix_supplement) AS total_options
FROM reservation_equipements re
JOIN equipements e ON e.id = re.equipement_id
GROUP BY re.reservation_id;
```

C'est exactement ce que fait `formatReservationEquipements()` côté code, mais via le select imbriqué Supabase (`reservation_equipements(equipements(...))`) plutôt qu'un vrai `JOIN` SQL écrit à la main.

## 5. Sous-requêtes

```sql
-- Clients ayant au moins une réservation confirmée
SELECT * FROM profiles
WHERE id IN (
  SELECT client_id FROM reservations WHERE status = 'confirmed'
);

-- Équivalent avec EXISTS (souvent plus performant, s'arrête au 1er match)
SELECT * FROM profiles p
WHERE EXISTS (
  SELECT 1 FROM reservations r
  WHERE r.client_id = p.id AND r.status = 'confirmed'
);

-- Véhicules plus chers que la moyenne
SELECT brand, model, price FROM vehicles
WHERE price > (SELECT AVG(price) FROM vehicles);
```

## 6. INSERT / UPDATE / DELETE

```sql
INSERT INTO reservations (vehicle_id, client_id, status, message)
VALUES ('<uuid-vehicule>', '<uuid-client>', 'pending', 'Intéressé par un essai');

UPDATE reservations SET status = 'confirmed' WHERE id = '<uuid>';

DELETE FROM reservations WHERE id = '<uuid>';
```

**Attention** : un `UPDATE`/`DELETE` sans `WHERE` s'applique à **toute la table** — piège classique posé à l'oral ("que se passe-t-il si j'oublie le WHERE ?").

## 7. CREATE TABLE et contraintes

```sql
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  client_id uuid NOT NULL REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  message text,
  rdv_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- `PRIMARY KEY` : identifiant unique de la ligne.
- `REFERENCES` : clé étrangère → garantit qu'on ne peut pas créer une réservation pointant vers un `vehicle_id` inexistant (intégrité référentielle).
- `NOT NULL` : colonne obligatoire.
- `DEFAULT` : valeur automatique si non fournie.
- `CHECK` : contrainte de validité (remplace un enum "à la main" en SQL pur).
- `UNIQUE` : pas de doublons (ex: pourrait s'appliquer à `profiles` si on voulait un email unique).

## 8. Index (pourquoi/quand)

```sql
CREATE INDEX idx_reservations_vehicle_id ON reservations(vehicle_id);
CREATE INDEX idx_reservations_client_id ON reservations(client_id);
```

- Accélère les recherches/jointures sur une colonne (au prix d'un coût en écriture et en espace disque).
- Les clés étrangères et colonnes souvent filtrées/jointes (`vehicle_id`, `client_id`, `status`) sont de bons candidats.
- Sans index, Postgres fait un **scan complet de la table** (`seq scan`) pour chaque requête filtrée sur cette colonne.

## 9. Transactions

```sql
BEGIN;
UPDATE vehicles SET status = 'reserved' WHERE id = '<uuid>';
UPDATE reservations SET status = 'confirmed' WHERE id = '<uuid>';
COMMIT;
-- ou ROLLBACK; si une des deux étapes échoue → aucune des deux n'est appliquée
```

- Garantit que plusieurs écritures liées réussissent **toutes ensemble ou pas du tout** (atomicité).
- Pertinent à mentionner pour justifier pourquoi un trigger Postgres (plutôt qu'un appel Express en 2 temps) sécurise la synchro `reservations.status` ↔ `vehicles.status` : le trigger s'exécute **dans la même transaction** que l'`UPDATE` qui le déclenche.

## 10. Trigger (rappel, lié à [back/supabase.md — le trigger PostgreSQL](../back/supabase.md#le-trigger-postgresql))

```sql
CREATE OR REPLACE FUNCTION sync_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    UPDATE vehicles SET status = 'reserved' WHERE id = NEW.vehicle_id;
  ELSIF NEW.status = 'cancelled' THEN
    UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_vehicle_status
AFTER UPDATE OF status ON reservations
FOR EACH ROW EXECUTE FUNCTION sync_vehicle_status();
```

Ceci est une **reconstitution pédagogique** de ce que fait probablement le trigger réel du projet (pas versionné dans le repo — cf. [back/supabase.md — le trigger PostgreSQL](../back/supabase.md#le-trigger-postgresql)). Utile pour montrer au jury que tu sais écrire un trigger, même si tu ne peux pas afficher le code exact stocké dans Supabase.

---

## Questions probables sur les requêtes SQL

1. **"Écris une requête qui donne le nombre de réservations confirmées par véhicule."**
   ```sql
   SELECT v.brand, v.model, COUNT(r.id) AS nb
   FROM vehicles v
   JOIN reservations r ON r.vehicle_id = v.id
   WHERE r.status = 'confirmed'
   GROUP BY v.id, v.brand, v.model;
   ```
2. **"Différence entre JOIN et LEFT JOIN ?"** → JOIN exclut les lignes sans correspondance, LEFT JOIN les garde avec `NULL` à droite.
3. **"Pourquoi une table associative pour les équipements et pas une colonne dans reservations ?"** → Une réservation peut avoir plusieurs équipements et un équipement peut être choisi par plusieurs réservations → relation many-to-many, impossible à modéliser avec une seule colonne.
4. **"Comment tu empêches une clé étrangère invalide ?"** → Contrainte `REFERENCES` au niveau de la table, Postgres refuse l'insertion sinon.
5. **"WHERE vs HAVING ?"** → `WHERE` avant le `GROUP BY` (ligne par ligne), `HAVING` après (sur le résultat agrégé).
6. **"Que fait `LIMIT`/`OFFSET` dans le projet ?"** → Pagination de l'API (`GET /api/vehicles?limit=20&offset=40`), plafonné à 100 côté serveur pour éviter qu'un client demande toute la table d'un coup.
7. **"Pourquoi utiliser Supabase (client) directement pour la lecture mais pas l'écriture ?"** → cf. [front/donnees.md](../front/donnees.md) — pas une question SQL pure mais souvent enchaînée par le jury.
