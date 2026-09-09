-- ============================================================================
-- Migration 002 — Durée d'essai + remise en disponible automatique
-- ============================================================================
-- Objectif : un essai n'est plus un instant unique (rdv_date) mais une
-- période (rdv_date -> rdv_date_fin, ex. « 3 jours d'essai »). Un job
-- applicatif (server/jobs/expireReservations.js, exécuté périodiquement
-- depuis server/index.js) passe en 'completed' tout essai CONFIRMÉ dont
-- rdv_date_fin est dépassée ; le trigger sync_vehicle_status_on_reservation
-- (déjà posé par la migration 001) s'occupe alors de remettre le véhicule en
-- 'available' — rien à changer côté trigger, on ne fait que fournir la borne
-- de fin qui lui manquait.
--
-- À appliquer manuellement via le SQL Editor Supabase, comme la migration 001
-- (aucun outil de ce projet n'a d'accès direct à la base).
-- ============================================================================

-- --- reservations.rdv_date_fin ---------------------------------------------
ALTER TABLE reservations ADD COLUMN rdv_date_fin timestamptz;

-- Essais existants avec une date de créneau : traités comme des essais d'un
-- jour (fin = début), pour ne pas laisser rdv_date_fin NULL alors que
-- rdv_date est renseignée. Les essais historiques sans rdv_date du tout
-- (champ optionnel avant cette migration) restent NULL des deux côtés : pas
-- de période à déduire, couvert explicitement par le CHECK et l'exclusion
-- plus bas.
UPDATE reservations SET rdv_date_fin = rdv_date WHERE rdv_date IS NOT NULL;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_date_fin_apres_debut
  CHECK (rdv_date_fin IS NULL OR rdv_date IS NULL OR rdv_date_fin >= rdv_date);

-- --- Anti-chevauchement : passe d'une égalité ponctuelle à un recouvrement
-- de plage ------------------------------------------------------------------
-- L'ancienne contrainte (migration 001) ne comparait que deux essais
-- confirmés au même rdv_date exact. Avec une vraie période, deux essais
-- confirmés qui se chevauchent sur le même véhicule (ex. jours 2-5 vs 4-7) ne
-- seraient plus détectés par une simple égalité : remplacée par une exclusion
-- sur le recouvrement des intervalles [rdv_date, rdv_date_fin].
-- Un essai sans rdv_date/rdv_date_fin est explicitement écarté du WHERE : un
-- range avec une borne NULL est illimité et bloquerait toute confirmation.
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_no_double_slot;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_no_double_slot
  EXCLUDE USING gist (vehicle_id WITH =, tstzrange(rdv_date, rdv_date_fin, '[]') WITH &&)
  WHERE (status = 'confirmed' AND rdv_date IS NOT NULL AND rdv_date_fin IS NOT NULL);

-- --- Index pour le job d'expiration -----------------------------------------
-- Requête du job : WHERE status = 'confirmed' AND rdv_date_fin < now().
CREATE INDEX reservations_confirmed_fin_idx
  ON reservations (rdv_date_fin)
  WHERE status = 'confirmed';


-- ============================================================================
-- ROLLBACK (à exécuter manuellement en cas de problème)
-- ============================================================================
-- DROP INDEX IF EXISTS reservations_confirmed_fin_idx;
-- ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_no_double_slot;
-- ALTER TABLE reservations
--   ADD CONSTRAINT reservations_no_double_slot
--   EXCLUDE USING gist (vehicle_id WITH =, rdv_date WITH =)
--   WHERE (status = 'confirmed');
-- ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_date_fin_apres_debut;
-- ALTER TABLE reservations DROP COLUMN IF EXISTS rdv_date_fin;
