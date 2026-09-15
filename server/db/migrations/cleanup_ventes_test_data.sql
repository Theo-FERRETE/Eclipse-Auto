-- ============================================================================
-- Nettoyage — données de test ventes
-- ============================================================================
-- À exécuter manuellement via le SQL Editor Supabase (aucun outil de ce projet
-- n'a d'accès direct à la base). Supprime toutes les ventes de test et remet
-- tous les véhicules en 'available', y compris ceux réservés par un essai en
-- cours (reset complet, adapté à des données de test — pas à de la prod réelle
-- avec des essais en attente à préserver).
-- ============================================================================

-- vente_equipements est en ON DELETE CASCADE (migration 001) : pas besoin de
-- le vider explicitement, la suppression des ventes s'en charge.
DELETE FROM ventes;

UPDATE vehicles SET status = 'available';
