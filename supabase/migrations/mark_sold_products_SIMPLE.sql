-- =====================================================
-- VERSION SIMPLIFIÉE - À exécuter dans Supabase SQL Editor
-- =====================================================
-- 
-- Ce script marque comme 'sold' tous les produits qui ont
-- des commandes actives pour qu'ils disparaissent du marché.
--
-- EXÉCUTEZ LES REQUÊTES UNE PAR UNE dans l'ordre :
-- =====================================================

-- 1. VÉRIFICATION : Voir quels produits seront affectés
SELECT 
    p.id,
    p.title,
    p.status as statut_actuel,
    COUNT(o.id) as nombre_commandes
FROM products p
INNER JOIN orders o ON o.product_id = p.id
WHERE 
    o.status IN ('pending', 'escrow_web2', 'shipped', 'completed')
    AND o.status != 'disputed'
    AND (p.status = 'available' OR p.status IS NULL)
GROUP BY p.id, p.title, p.status;

-- 2. MISE À JOUR : Marquer les produits comme vendus
UPDATE products
SET status = 'sold'
WHERE id IN (
    SELECT DISTINCT p.id
    FROM products p
    INNER JOIN orders o ON o.product_id = p.id
    WHERE 
        o.status IN ('pending', 'escrow_web2', 'shipped', 'completed')
        AND o.status != 'disputed'
        AND (p.status = 'available' OR p.status IS NULL)
);

-- 3. VÉRIFICATION FINALE : S'assurer que tout est bon
SELECT COUNT(*) as produits_restants_a_corriger
FROM products p
INNER JOIN orders o ON o.product_id = p.id
WHERE 
    p.status = 'available'
    AND o.status IN ('pending', 'escrow_web2', 'shipped', 'completed')
    AND o.status != 'disputed';

-- Si cette dernière requête retourne 0, c'est parfait ! ✅












