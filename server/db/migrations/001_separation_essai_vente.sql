-- ============================================================================
-- Migration 001 — Séparation essai / vente
-- ============================================================================
-- ✅ Appliquée avec succès sur Supabase (main, production) le 2026-09-09,
-- manuellement via le SQL Editor (aucun outil de ce projet n'a d'accès direct
-- à la base). Conservée ici comme trace versionnée du schéma.
--
-- Trois correctifs ont été nécessaires en cours de route par rapport à la
-- version ci-dessous, découverts uniquement en l'exécutant en conditions
-- réelles (déjà intégrés dans le texte qui suit) :
--   - trigger on_reservation_status_change + contrainte CHECK
--     reservations_status_check (non documentés) bloquaient l'ALTER TYPE de
--     reservations.status,
--   - fonction du trigger complétée pour gérer le nouveau statut 'completed',
--   - vehicles.id est un integer (pas un uuid comme indiqué dans
--     docs/back/supabase.md) : ventes.vehicle_id corrigé en conséquence.
--
-- Vérifications faites le 2026-09-09 directement sur le projet Supabase (main,
-- production) :
--   1. SELECT DISTINCT power FROM vehicles; -> seulement 296 et NULL, aucune
--      valeur texte non convertible. La conversion `power` plus bas est sûre.
--   2. Types de created_at (information_schema.columns) : seule
--      vehicles.created_at est en `timestamp without time zone` ;
--      reservations.created_at et profiles.created_at sont déjà en
--      `timestamptz` et ne sont donc pas touchées par cette migration.
--   3. `mode_paiement` (carte, virement, financement, especes) : validé avec
--      l'utilisateur, champ purement descriptif, pas d'intégration de paiement.
--
-- ⚠️ Reste à faire avant de lancer la Section A :
--   Prendre un backup / travailler sur une branche Supabase avant de lancer
--   la section A (conversions de types sur des tables existantes). La
--   section B/C/D (nouvelles tables) est additive et sans risque pour les
--   données existantes.
-- ============================================================================


-- ============================================================================
-- SECTION A — Corrections de types sur l'existant
-- ============================================================================

-- Nécessaire pour la contrainte d'exclusion plus bas (opérateurs d'égalité
-- utilisables dans un index GiST sur uuid / timestamptz).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- --- vehicles.power : text -> integer -----------------------------------
-- Voir l'avertissement en tête de fichier : vérifier SELECT DISTINCT power
-- FROM vehicles avant d'exécuter cette ligne.
ALTER TABLE vehicles
  ALTER COLUMN power TYPE integer USING NULLIF(power, '')::integer;

-- --- vehicles.price / mileage, equipements.prix_supplement : NUMERIC -----
ALTER TABLE vehicles
  ALTER COLUMN price TYPE numeric(10, 2) USING price::numeric,
  ALTER COLUMN mileage TYPE integer USING mileage::integer;

ALTER TABLE equipements
  ALTER COLUMN prix_supplement TYPE numeric(10, 2) USING prix_supplement::numeric;

-- --- created_at -> TIMESTAMPTZ --------------------------------------------
-- Vérifié le 2026-09-09 via information_schema.columns : seule vehicles.created_at
-- est encore en `timestamp without time zone`. reservations.created_at et
-- profiles.created_at sont déjà en `timestamptz` : on ne les touche pas
-- (les reconvertir risquerait de décaler leurs dates pour rien).
ALTER TABLE vehicles
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

-- --- vehicles.status -> ENUM ----------------------------------------------
CREATE TYPE vehicle_status AS ENUM ('available', 'reserved', 'sold');

ALTER TABLE vehicles ALTER COLUMN status DROP DEFAULT;
ALTER TABLE vehicles
  ALTER COLUMN status TYPE vehicle_status USING status::vehicle_status;
ALTER TABLE vehicles ALTER COLUMN status SET DEFAULT 'available'::vehicle_status;

-- --- reservations.status -> ENUM (+ 'completed') --------------------------
-- Deux objets existants (non versionnés jusqu'ici, retrouvés en base le
-- 2026-09-09) dépendent de cette colonne et bloquent l'ALTER TYPE tant qu'ils
-- existent :
--   1. Trigger on_reservation_status_change / sync_vehicle_status_on_reservation
--      (AFTER UPDATE OF status) -> "cannot alter type of a column used in a
--      trigger definition".
--   2. Contrainte CHECK reservations_status_check
--      (CHECK (status = ANY (ARRAY['pending','confirmed','cancelled']::text[])))
--      -> "operator does not exist: reservation_status = text" (Postgres tente
--      de revalider le CHECK contre le nouveau type, mais le tableau littéral
--      est figé en text[] depuis sa création).
-- On supprime les deux, on convertit la colonne, puis on recrée le trigger
-- (fonction complétée pour gérer 'completed', voir plus bas). Le CHECK n'est
-- pas recréé : un ENUM ne peut de toute façon contenir que ses valeurs
-- déclarées, la contrainte devient redondante.
DROP TRIGGER IF EXISTS on_reservation_status_change ON reservations;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

ALTER TABLE reservations ALTER COLUMN status DROP DEFAULT;
ALTER TABLE reservations
  ALTER COLUMN status TYPE reservation_status USING status::reservation_status;
ALTER TABLE reservations ALTER COLUMN status SET DEFAULT 'pending'::reservation_status;

-- Fonction existante, complétée : le trigger d'origine ne gérait que
-- 'confirmed' -> vehicles 'reserved' et 'cancelled' -> vehicles 'available'.
-- 'completed' est un nouveau statut introduit par cette migration (essai
-- terminé, point de départ du bouton "Concrétiser la vente" en phase 3) ; sans
-- ce cas, le véhicule resterait bloqué en 'reserved' après un essai terminé.
CREATE OR REPLACE FUNCTION public.sync_vehicle_status_on_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.status = 'confirmed' THEN
    UPDATE vehicles SET status = 'reserved' WHERE id = NEW.vehicle_id;
  ELSIF NEW.status = 'cancelled' OR NEW.status = 'completed' THEN
    UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_reservation_status_change
  AFTER UPDATE OF status ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION sync_vehicle_status_on_reservation();


-- ============================================================================
-- SECTION B — Essai (reservations) : retrait des équipements + créneau
-- ============================================================================

-- La logique d'options passe entièrement sur `ventes` (section C). La table
-- de jonction n'a plus lieu d'être.
DROP TABLE IF EXISTS reservation_equipements;

-- Anti-double-créneau : deux essais CONFIRMÉS ne peuvent pas porter sur le
-- même véhicule au même rdv_date. Les lignes 'pending'/'cancelled'/'completed'
-- ne sont pas concernées (WHERE), et deux NULL ne s'excluent jamais entre eux.
ALTER TABLE reservations
  ADD CONSTRAINT reservations_no_double_slot
  EXCLUDE USING gist (vehicle_id WITH =, rdv_date WITH =)
  WHERE (status = 'confirmed');


-- ============================================================================
-- SECTION C — Vente (nouveau)
-- ============================================================================

CREATE TYPE vente_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Proposition à valider (voir avertissement en tête de fichier).
CREATE TYPE payment_method AS ENUM ('carte', 'virement', 'financement', 'especes');

CREATE TABLE ventes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Comme reservations.client_id existant : référence auth.users sans FK
  -- déclarée (voir docs/back/supabase.md — pas de FK vers profiles/auth.users
  -- dans ce projet). client_id est toujours renseigné depuis le JWT côté API.
  client_id       uuid NOT NULL,
  -- vehicles.id est un integer (pas un uuid, malgré la doc) : vérifié en base
  -- le 2026-09-09 via information_schema.columns.
  vehicle_id      integer NOT NULL REFERENCES vehicles(id),
  reservation_id  uuid REFERENCES reservations(id),
  prix_final      numeric(10, 2) NOT NULL CHECK (prix_final >= 0),
  mode_paiement   payment_method NOT NULL,
  status          vente_status NOT NULL DEFAULT 'pending',
  date_vente      timestamptz NOT NULL DEFAULT now(),
  date_livraison  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Une seule vente CONFIRMÉE par véhicule (affinage vs schéma doc : `status`
-- remplace le UNIQUE(vehicle_id) brut pour garder le workflow admin
-- confirme/annule).
CREATE UNIQUE INDEX one_confirmed_sale ON ventes (vehicle_id) WHERE status = 'confirmed';

CREATE INDEX ventes_client_id_idx ON ventes (client_id);
CREATE INDEX ventes_status_idx ON ventes (status);

CREATE TABLE vente_equipements (
  vente_id      uuid NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
  equipement_id uuid NOT NULL REFERENCES equipements(id),
  PRIMARY KEY (vente_id, equipement_id)
);

-- --- Trigger : passage en 'confirmed' -> véhicule 'sold' -------------------
-- L'email de confirmation d'achat n'est PAS envoyé ici : comme pour les
-- essais (reservationController.updateStatus), il part depuis le serveur
-- Express au moment du PATCH /api/ventes/:id/status (phase 2), pas depuis un
-- trigger Postgres.
CREATE OR REPLACE FUNCTION mark_vehicle_sold()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    UPDATE vehicles SET status = 'sold' WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_vehicle_sold_trigger
  AFTER UPDATE OF status ON ventes
  FOR EACH ROW
  EXECUTE FUNCTION mark_vehicle_sold();


-- ============================================================================
-- SECTION D — RLS sur les nouvelles tables
-- ============================================================================
-- Défense en profondeur, comme documenté pour `reservations` : le serveur
-- (clé service_role) contourne la RLS et reste le seul chemin d'écriture ;
-- ces politiques ne protègent que d'un accès direct via la clé anon/authenticated.

ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vente_equipements ENABLE ROW LEVEL SECURITY;

CREATE POLICY ventes_select_own ON ventes
  FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY vente_equipements_select_own ON vente_equipements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ventes
      WHERE ventes.id = vente_equipements.vente_id
        AND ventes.client_id = auth.uid()
    )
  );

-- Aucune politique INSERT/UPDATE/DELETE pour anon/authenticated : ces
-- opérations passent uniquement par le serveur (service_role, hors RLS).


-- ============================================================================
-- SECTION E — Droits GRANT (trouvé en testant en conditions réelles le 2026-09-09)
-- ============================================================================
-- Sans ça : "permission denied for table ventes", y compris pour service_role.
-- La RLS (section D) ne remplace pas les droits SQL de base : ce sont deux
-- portes séparées. Les tables créées via le SQL Editor n'héritent pas
-- automatiquement des GRANT que Supabase pose pour les tables créées depuis
-- son propre dashboard — contrairement à `reservations`/`vehicles`, qui les
-- avaient déjà. RLS (section D) reste la vraie barrière pour anon/authenticated
-- (aucune policy INSERT/UPDATE/DELETE pour eux) ; service_role, lui, contourne
-- la RLS mais a quand même besoin de ce GRANT pour toucher la table.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ventes TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE vente_equipements TO anon, authenticated, service_role;


-- ============================================================================
-- ROLLBACK (à exécuter manuellement en cas de problème, section C/D seulement
-- — la section A modifie des données existantes et n'est pas trivialement
-- réversible : restaurer depuis le backup dans ce cas)
-- ============================================================================
-- DROP TABLE IF EXISTS vente_equipements;
-- DROP TABLE IF EXISTS ventes;
-- DROP TRIGGER IF EXISTS mark_vehicle_sold_trigger ON ventes;
-- DROP FUNCTION IF EXISTS mark_vehicle_sold();
-- DROP TYPE IF EXISTS vente_status;
-- DROP TYPE IF EXISTS payment_method;
-- ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_no_double_slot;
