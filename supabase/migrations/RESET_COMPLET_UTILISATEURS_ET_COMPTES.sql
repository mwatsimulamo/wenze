-- ================================================================
-- SCRIPT DE RÉINITIALISATION COMPLÈTE
-- Supprime TOUTES les données utilisateurs et leurs comptes
-- Prêt pour l'intégration de l'escrow blockchain
-- ================================================================
-- ⚠️  ATTENTION : Ce script est DESTRUCTIF et irréversible
-- ⚠️  Toutes les données utilisateurs seront PERMANENTEMENT supprimées
-- ================================================================

BEGIN;

-- Désactiver temporairement les contraintes de clés étrangères pour faciliter la suppression
-- (Les supprimer dans l'ordre inverse des dépendances)

-- ================================================================
-- ÉTAPE 1 : Supprimer les données dépendantes (enfants)
-- ================================================================

-- 1.1 Supprimer tous les messages (dépendent de orders et profiles)
DELETE FROM messages;
SELECT '✅ Messages supprimés' as status;

-- 1.2 Supprimer toutes les évaluations/ratings (dépendent de orders et profiles)
DELETE FROM ratings;
SELECT '✅ Ratings supprimés' as status;

-- 1.3 Supprimer toutes les transactions WZP (dépendent de profiles) - si la table existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wzp_transactions') THEN
        DELETE FROM wzp_transactions;
        RAISE NOTICE '✅ Transactions WZP supprimées';
    ELSE
        RAISE NOTICE 'ℹ️ Table wzp_transactions n''existe pas - ignorée';
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 2 : Supprimer les commandes (dépendent de products et profiles)
-- ================================================================

DELETE FROM orders;
SELECT '✅ Commandes supprimées' as status;

-- ================================================================
-- ÉTAPE 3 : Supprimer tous les produits (dépendent de profiles)
-- ================================================================

DELETE FROM products;
SELECT '✅ Produits supprimés' as status;

-- ================================================================
-- ÉTAPE 4 : Supprimer tous les profils (dépendent de auth.users)
-- ================================================================

DELETE FROM profiles;
SELECT '✅ Profils supprimés' as status;

-- ================================================================
-- ÉTAPE 5 : Supprimer tous les comptes utilisateurs (auth.users)
-- ================================================================
-- Note : Cette opération nécessite des privilèges spéciaux dans Supabase
-- Si vous obtenez une erreur de permissions, utilisez le Dashboard Supabase
-- Authentication > Users > Sélectionner tous > Delete

-- Supprimer tous les utilisateurs de auth.users
-- Cette commande peut nécessiter des privilèges admin
DELETE FROM auth.users;
SELECT '✅ Comptes utilisateurs supprimés' as status;

-- ================================================================
-- VÉRIFICATION FINALE
-- ================================================================

SELECT 
    '📊 RÉSUMÉ DE LA SUPPRESSION' as titre,
    (SELECT COUNT(*) FROM messages) as messages_restants,
    (SELECT COUNT(*) FROM ratings) as ratings_restants,
    (SELECT COUNT(*) FROM orders) as commandes_restantes,
    (SELECT COUNT(*) FROM products) as produits_restants,
    (SELECT COUNT(*) FROM profiles) as profils_restants,
    (SELECT COUNT(*) FROM auth.users) as utilisateurs_restants,
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wzp_transactions') 
                 THEN (SELECT COUNT(*) FROM wzp_transactions)::text 
                 ELSE 'Table n''existe pas' END) as transactions_wzp_restantes;

-- Si tous les compteurs sont à 0, la suppression est réussie
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM messages) = 0 
         AND (SELECT COUNT(*) FROM ratings) = 0
         AND (SELECT COUNT(*) FROM orders) = 0
         AND (SELECT COUNT(*) FROM products) = 0
         AND (SELECT COUNT(*) FROM profiles) = 0
         AND (SELECT COUNT(*) FROM auth.users) = 0
         AND (CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wzp_transactions')
                   THEN (SELECT COUNT(*) FROM wzp_transactions) = 0
                   ELSE true END)
        THEN '✅ SUPPRESSION COMPLÈTE RÉUSSIE - Base de données prête pour l''escrow'
        ELSE '⚠️ ATTENTION : Certaines données n''ont pas été supprimées. Vérifiez les compteurs ci-dessus.'
    END as resultat_final;

COMMIT;

-- ================================================================
-- NOTES IMPORTANTES
-- ================================================================
-- 
-- 1. Si vous obtenez une erreur de permissions pour DELETE FROM auth.users :
--    - Utilisez le Dashboard Supabase : Authentication > Users
--    - Sélectionnez tous les utilisateurs et supprimez-les manuellement
--
-- 2. Après la suppression :
--    - La base de données est prête pour recevoir de nouveaux utilisateurs
--    - Les nouveaux comptes créeront automatiquement des profils (grâce au trigger)
--    - Les nouvelles données seront propres pour l'intégration de l'escrow
--
-- 3. Si vous voulez annuler cette opération :
--    - Ne COMMITtez pas la transaction (utilisez ROLLBACK à la place)
--    - Attention : ROLLBACK doit être fait avant COMMIT
--
-- ================================================================

