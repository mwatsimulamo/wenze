-- =====================================================
-- RESET COMPLET DU MARCHÉ - Version Corrigée
-- =====================================================
-- 
-- Ce script supprime TOUS les produits et TOUS les historiques
-- de commandes pour permettre de repartir à zéro.
--
-- ⚠️ ATTENTION : Action irréversible !
-- =====================================================

-- Copiez-collez tout ce bloc dans Supabase SQL Editor et exécutez

BEGIN;

-- 1. Supprimer les messages de chat
DELETE FROM messages;

-- 2. Supprimer les évaluations
DELETE FROM ratings;

-- 3. Supprimer toutes les commandes
DELETE FROM orders;

-- 4. Supprimer tous les produits
DELETE FROM products;

-- Afficher le résultat
SELECT 
    '✅ SUPPRESSION TERMINÉE' as status,
    (SELECT COUNT(*) FROM products) as produits_restants,
    (SELECT COUNT(*) FROM orders) as commandes_restantes,
    (SELECT COUNT(*) FROM messages) as messages_restants,
    (SELECT COUNT(*) FROM ratings) as evaluations_restantes;

COMMIT;

-- Si toutes les valeurs sont 0, c'est parfait ! ✅







