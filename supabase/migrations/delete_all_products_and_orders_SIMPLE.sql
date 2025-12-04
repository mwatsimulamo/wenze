-- =====================================================
-- VERSION SIMPLIFIÉE - À exécuter dans Supabase SQL Editor
-- =====================================================
-- 
-- Ce script supprime TOUS les produits et TOUS les historiques
-- de commandes pour permettre de repartir à zéro.
--
-- EXÉCUTEZ LES REQUÊTES UNE PAR UNE dans l'ordre :
-- =====================================================

-- 1. VÉRIFICATION : Voir combien d'éléments seront supprimés
SELECT 
    (SELECT COUNT(*) FROM products) as produits,
    (SELECT COUNT(*) FROM orders) as commandes,
    (SELECT COUNT(*) FROM messages) as messages,
    (SELECT COUNT(*) FROM ratings) as evaluations,
    (SELECT COUNT(*) FROM wzp_transactions WHERE reference_id IS NOT NULL) as transactions_wzp;

-- 2. SUPPRESSION : Exécutez chaque DELETE une par une

-- 2.1 Supprimer les messages
DELETE FROM messages;

-- 2.2 Supprimer les évaluations
DELETE FROM ratings;

-- 2.3 Supprimer les transactions WZP liées aux commandes
DELETE FROM wzp_transactions WHERE reference_id IS NOT NULL;

-- 2.4 Supprimer toutes les commandes
DELETE FROM orders;

-- 2.5 Supprimer tous les produits
DELETE FROM products;

-- 3. VÉRIFICATION FINALE : Vérifier que tout a été supprimé
SELECT 
    (SELECT COUNT(*) FROM products) as produits_restants,
    (SELECT COUNT(*) FROM orders) as commandes_restantes,
    (SELECT COUNT(*) FROM messages) as messages_restants,
    (SELECT COUNT(*) FROM ratings) as evaluations_restantes,
    (SELECT COUNT(*) FROM wzp_transactions WHERE reference_id IS NOT NULL) as transactions_wzp_restantes;

-- Si toutes les valeurs sont 0, c'est parfait ! ✅







