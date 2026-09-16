-- ============================================================================
-- Migration 004 — Colonne slug indexée sur vehicles
-- ============================================================================
-- À appliquer manuellement via le SQL Editor Supabase, comme les migrations
-- précédentes (aucun outil de ce projet n'a d'accès direct à la base).
--
-- Avant : GET /api/vehicles/by-slug/:slug (vehicleController.getBySlug)
-- chargeait TOUTE la table puis recalculait le slug de chaque véhicule en
-- JavaScript pour trouver la correspondance — une lecture complète de la
-- table pour afficher une seule fiche. Cette migration ajoute une colonne
-- slug calculée et indexée : le contrôleur peut filtrer directement en SQL
-- (WHERE slug = ...).
--
-- ⚠️ Pas de contrainte UNIQUE sur slug, volontairement : deux véhicules du
-- même modèle (brand+model identiques, ex. deux Golf GTI d'occasion en stock)
-- produiraient le même slug et feraient échouer la migration au moment du
-- backfill. Le comportement actuel — .find() retourne le premier match par
-- created_at décroissant, donc le véhicule le plus récent — est préservé à
-- l'identique par ORDER BY created_at DESC LIMIT 1 côté requête plutôt que
-- garanti par une contrainte. Si ce cas ne s'est jamais produit sur les
-- données réelles, une contrainte UNIQUE peut être ajoutée après coup.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE vehicles ADD COLUMN slug text;

-- Même algorithme que l'ancien calcul JS (vehicleController.getBySlug) :
-- minuscules, accents retirés, tout ce qui n'est pas [a-z0-9] remplacé par
-- un tiret, tirets de bord supprimés.
CREATE OR REPLACE FUNCTION set_vehicle_slug()
RETURNS trigger AS $$
BEGIN
  NEW.slug := regexp_replace(
    regexp_replace(lower(unaccent(NEW.brand || '-' || NEW.model)), '[^a-z0-9]+', '-', 'g'),
    '^-+|-+$', '', 'g'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicles_set_slug
  BEFORE INSERT OR UPDATE OF brand, model ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION set_vehicle_slug();

-- Backfill des véhicules existants (le trigger ne joue que sur les
-- INSERT/UPDATE à venir).
UPDATE vehicles SET slug = regexp_replace(
  regexp_replace(lower(unaccent(brand || '-' || model)), '[^a-z0-9]+', '-', 'g'),
  '^-+|-+$', '', 'g'
);

ALTER TABLE vehicles ALTER COLUMN slug SET NOT NULL;

CREATE INDEX vehicles_slug_idx ON vehicles(slug);

-- ============================================================================
-- ROLLBACK (à exécuter manuellement en cas de problème)
-- ============================================================================
-- DROP INDEX IF EXISTS vehicles_slug_idx;
-- DROP TRIGGER IF EXISTS vehicles_set_slug ON vehicles;
-- DROP FUNCTION IF EXISTS set_vehicle_slug();
-- ALTER TABLE vehicles DROP COLUMN IF EXISTS slug;
