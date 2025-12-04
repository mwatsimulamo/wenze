-- ================================================================
-- VERSION SIMPLIFIÉE - Suppression sans transaction
-- Pour utiliser dans le SQL Editor de Supabase
-- Exécutez chaque bloc séparément
-- ================================================================

-- Bloc 1 : Supprimer les messages
DELETE FROM messages;
SELECT '✅ Messages supprimés' as status;

-- Bloc 2 : Supprimer les ratings
DELETE FROM ratings;
SELECT '✅ Ratings supprimés' as status;

-- Bloc 3 : Supprimer les transactions WZP (si la table existe)
-- ⚠️ Si cette table n'existe pas dans votre base, ignorez ce bloc
-- DELETE FROM wzp_transactions;
-- SELECT '✅ Transactions WZP supprimées' as status;
SELECT 'ℹ️ Bloc wzp_transactions ignoré (table n''existe pas)' as status;

-- Bloc 4 : Supprimer les commandes
DELETE FROM orders;
SELECT '✅ Commandes supprimées' as status;

-- Bloc 5 : Supprimer les produits
DELETE FROM products;
SELECT '✅ Produits supprimés' as status;

-- Bloc 6 : Supprimer les profils
DELETE FROM profiles;
SELECT '✅ Profils supprimés' as status;

-- Bloc 7 : Supprimer les comptes utilisateurs
-- ⚠️ Si erreur de permissions, utilisez le Dashboard Supabase :
-- Authentication > Users > Sélectionner tous > Delete
DELETE FROM auth.users;
SELECT '✅ Comptes utilisateurs supprimés' as status;

-- Bloc 8 : Vérification finale
SELECT 
    (SELECT COUNT(*) FROM messages) as messages_restants,
    (SELECT COUNT(*) FROM ratings) as ratings_restants,
    (SELECT COUNT(*) FROM orders) as commandes_restantes,
    (SELECT COUNT(*) FROM products) as produits_restants,
    (SELECT COUNT(*) FROM profiles) as profils_restants,
    (SELECT COUNT(*) FROM auth.users) as utilisateurs_restants,
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wzp_transactions') 
                 THEN (SELECT COUNT(*) FROM wzp_transactions)::text 
                 ELSE 'Table n''existe pas' END) as transactions_wzp_restantes;

-- Si tous sont à 0, c'est réussi !
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
        THEN '✅ SUPPRESSION COMPLÈTE RÉUSSIE'
        ELSE '⚠️ VÉRIFIEZ LES COMPTEURS CI-DESSUS'
    END as resultat;

