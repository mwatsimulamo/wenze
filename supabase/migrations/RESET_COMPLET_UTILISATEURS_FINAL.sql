-- ================================================================
-- VERSION FINALE - Suppression complète (sans wzp_transactions)
-- Pour utiliser dans le SQL Editor de Supabase
-- ================================================================
-- ⚠️  ATTENTION : Ce script est DESTRUCTIF et irréversible
-- ⚠️  Toutes les données utilisateurs seront PERMANENTEMENT supprimées
-- ================================================================

BEGIN;

-- ================================================================
-- ÉTAPE 1 : Supprimer les données dépendantes (enfants)
-- ================================================================

-- 1.1 Supprimer tous les messages
DELETE FROM messages;
SELECT '✅ Messages supprimés' as status;

-- 1.2 Supprimer toutes les évaluations/ratings
DELETE FROM ratings;
SELECT '✅ Ratings supprimés' as status;

-- 1.3 Supprimer les transactions WZP (si la table existe - ignorée sinon)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wzp_transactions') THEN
        DELETE FROM wzp_transactions;
        RAISE NOTICE '✅ Transactions WZP supprimées';
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 2 : Supprimer les commandes
-- ================================================================

DELETE FROM orders;
SELECT '✅ Commandes supprimées' as status;

-- ================================================================
-- ÉTAPE 3 : Supprimer tous les produits
-- ================================================================

DELETE FROM products;
SELECT '✅ Produits supprimés' as status;

-- ================================================================
-- ÉTAPE 4 : Supprimer tous les profils
-- ================================================================

DELETE FROM profiles;
SELECT '✅ Profils supprimés' as status;

-- ================================================================
-- ÉTAPE 5 : Supprimer tous les comptes utilisateurs
-- ================================================================
-- ⚠️ Si erreur de permissions, utilisez le Dashboard Supabase :
-- Authentication > Users > Sélectionner tous > Delete

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
    (SELECT COUNT(*) FROM auth.users) as utilisateurs_restants;

-- Si tous les compteurs sont à 0, la suppression est réussie
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM messages) = 0 
         AND (SELECT COUNT(*) FROM ratings) = 0
         AND (SELECT COUNT(*) FROM orders) = 0
         AND (SELECT COUNT(*) FROM products) = 0
         AND (SELECT COUNT(*) FROM profiles) = 0
         AND (SELECT COUNT(*) FROM auth.users) = 0
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
-- 2. La table wzp_transactions est vérifiée avant suppression
--    - Si elle existe, elle sera supprimée
--    - Si elle n'existe pas, elle sera ignorée (pas d'erreur)
--
-- 3. Après la suppression :
--    - La base de données est prête pour recevoir de nouveaux utilisateurs
--    - Les nouveaux comptes créeront automatiquement des profils (grâce au trigger)
--    - Les nouvelles données seront propres pour l'intégration de l'escrow
--
-- ================================================================









