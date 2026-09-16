-- ============================================================================
-- Migration 003 — Annulation d'une vente déjà confirmée
-- ============================================================================
-- À appliquer manuellement via le SQL Editor Supabase, comme les migrations
-- précédentes (aucun outil de ce projet n'a d'accès direct à la base).
--
-- Constat : mark_vehicle_sold (migration 001) ne gère que le sens
-- pending -> confirmed (véhicule mis en 'sold'). Il n'existe aucun trigger
-- symétrique pour confirmed -> cancelled : un admin qui annule une vente déjà
-- confirmée (PATCH /api/ventes/:id/status, statut autorisé par
-- VENTE_UPDATABLE_STATUSES) laisse donc le véhicule bloqué en 'sold', sans
-- vente valide derrière. C'est précisément pour ça que le bouton d'annulation
-- côté client (PATCH /api/ventes/:id/cancel) est volontairement limité aux
-- ventes encore 'pending' — cette migration comble le trou côté admin.
--
-- Sûr par construction : au moment où NEW.status passe de 'confirmed' à
-- 'cancelled', l'index one_confirmed_sale garantit qu'aucune AUTRE vente
-- confirmée n'existe pour ce véhicule (une seule vente peut être 'confirmed'
-- à la fois) — remettre le véhicule en 'available' ne peut donc pas écraser
-- une vente concurrente.
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_vehicle_sold()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    UPDATE vehicles SET status = 'sold' WHERE id = NEW.vehicle_id;
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROLLBACK (à exécuter manuellement en cas de problème)
-- ============================================================================
-- CREATE OR REPLACE FUNCTION mark_vehicle_sold()
-- RETURNS trigger AS $$
-- BEGIN
--   IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
--     UPDATE vehicles SET status = 'sold' WHERE id = NEW.vehicle_id;
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
