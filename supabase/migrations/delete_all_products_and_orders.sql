-- =====================================================
-- Script SQL : Supprimer TOUS les produits et commandes
-- =====================================================
-- 
-- ATTENTION : Ce script supprime DÉFINITIVEMENT :
-- - Tous les produits
-- - Toutes les commandes (historiques)
-- - Tous les messages de chat
-- - Toutes les évaluations (ratings)
-- - Toutes les transactions WZP liées aux commandes
--
-- Ce script permet de repartir à zéro pour les tests.
--
-- IMPORTANT : Faites une sauvegarde avant d'exécuter !
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : VÉRIFICATION (à exécuter d'abord)
-- =====================================================
-- Cette requête montre ce qui sera supprimé

SELECT 'PRODUCTS' as table_name, COUNT(*) as nombre FROM products
UNION ALL
SELECT 'ORDERS', COUNT(*) FROM orders
UNION ALL
SELECT 'MESSAGES', COUNT(*) FROM messages
UNION ALL
SELECT 'RATINGS', COUNT(*) FROM ratings
UNION ALL
SELECT 'WZP_TRANSACTIONS', COUNT(*) FROM wzp_transactions WHERE reference_id IS NOT NULL;

-- =====================================================
-- ÉTAPE 2 : SUPPRESSION (à exécuter après vérification)
-- =====================================================
-- Ordre de suppression important (clés étrangères)

BEGIN;

-- 1. Supprimer les messages (référencent orders)
DELETE FROM messages;

-- 2. Supprimer les ratings (référencent orders)
DELETE FROM ratings;

-- 3. Supprimer les transactions WZP liées aux commandes
DELETE FROM wzp_transactions WHERE reference_id IS NOT NULL;

-- 4. Supprimer toutes les commandes (référencent products)
DELETE FROM orders;

-- 5. Supprimer tous les produits
DELETE FROM products;

-- Afficher les résultats
SELECT 'SUPPRESSION TERMINÉE' as status;

COMMIT;

-- =====================================================
-- ÉTAPE 3 : VÉRIFICATION FINALE
-- =====================================================
-- Vérifier que tout a été supprimé (devrait retourner 0 partout)

SELECT 'PRODUCTS' as table_name, COUNT(*) as restants FROM products
UNION ALL
SELECT 'ORDERS', COUNT(*) FROM orders
UNION ALL
SELECT 'MESSAGES', COUNT(*) FROM messages
UNION ALL
SELECT 'RATINGS', COUNT(*) FROM ratings
UNION ALL
SELECT 'WZP_TRANSACTIONS', COUNT(*) FROM wzp_transactions WHERE reference_id IS NOT NULL;

-- Si toutes les valeurs sont 0, la suppression est réussie ! ✅






