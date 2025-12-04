-- ================================================================
-- VERSION ULTRA-SIMPLE - Sans wzp_transactions
-- Pour utiliser dans le SQL Editor de Supabase
-- Exécutez chaque bloc séparément OU tout d'un coup
-- ================================================================
-- ⚠️  ATTENTION : Ce script est DESTRUCTIF et irréversible
-- ================================================================

BEGIN;

-- 1. Supprimer les messages
DELETE FROM messages;
SELECT '✅ Messages supprimés' as status;

-- 2. Supprimer les ratings
DELETE FROM ratings;
SELECT '✅ Ratings supprimés' as status;

-- 3. Supprimer les commandes
DELETE FROM orders;
SELECT '✅ Commandes supprimées' as status;

-- 4. Supprimer les produits
DELETE FROM products;
SELECT '✅ Produits supprimés' as status;

-- 5. Supprimer les profils
DELETE FROM profiles;
SELECT '✅ Profils supprimés' as status;

-- 6. Supprimer les comptes utilisateurs
-- ⚠️ Si erreur de permissions, utilisez le Dashboard Supabase :
-- Authentication > Users > Sélectionner tous > Delete
DELETE FROM auth.users;
SELECT '✅ Comptes utilisateurs supprimés' as status;

-- Vérification finale
SELECT 
    '📊 RÉSUMÉ' as titre,
    (SELECT COUNT(*) FROM messages) as messages,
    (SELECT COUNT(*) FROM ratings) as ratings,
    (SELECT COUNT(*) FROM orders) as commandes,
    (SELECT COUNT(*) FROM products) as produits,
    (SELECT COUNT(*) FROM profiles) as profils,
    (SELECT COUNT(*) FROM auth.users) as utilisateurs;

-- Résultat
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM messages) = 0 
         AND (SELECT COUNT(*) FROM ratings) = 0
         AND (SELECT COUNT(*) FROM orders) = 0
         AND (SELECT COUNT(*) FROM products) = 0
         AND (SELECT COUNT(*) FROM profiles) = 0
         AND (SELECT COUNT(*) FROM auth.users) = 0
        THEN '✅ SUPPRESSION RÉUSSIE - Prêt pour l''escrow'
        ELSE '⚠️ VÉRIFIEZ LES COMPTEURS CI-DESSUS'
    END as resultat;

COMMIT;



