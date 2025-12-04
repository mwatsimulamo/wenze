-- =====================================================
-- Script SQL : Marquer comme vendus les produits avec commandes actives
-- =====================================================
-- 
-- Ce script marque automatiquement comme 'sold' tous les produits
-- qui ont des commandes actives (pending, escrow_web2, shipped, completed)
-- afin qu'ils n'apparaissent plus sur le marché.
--
-- IMPORTANT : Exécutez d'abord la version VÉRIFICATION pour voir
-- quels produits seront affectés.
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : VÉRIFICATION (à exécuter d'abord)
-- =====================================================
-- Cette requête montre tous les produits qui seront marqués comme 'sold'

SELECT 
    p.id,
    p.title,
    p.status as statut_actuel,
    COUNT(o.id) as nombre_commandes,
    STRING_AGG(DISTINCT o.status, ', ') as statuts_commandes,
    MAX(o.created_at) as derniere_commande
FROM products p
INNER JOIN orders o ON o.product_id = p.id
WHERE 
    -- Produits qui ont des commandes actives
    o.status IN ('pending', 'escrow_web2', 'shipped', 'completed')
    -- Exclure les commandes en litige ou annulées
    AND o.status != 'disputed'
    -- Pour les négociations, seulement si payées (escrow ouvert)
    AND (
        o.order_mode = 'direct' 
        OR (o.order_mode = 'negotiation' AND o.escrow_status = 'open')
        OR (o.order_mode = 'negotiation' AND o.status IN ('shipped', 'completed'))
    )
    -- Uniquement les produits pas encore marqués comme vendus
    AND (p.status = 'available' OR p.status IS NULL)
GROUP BY p.id, p.title, p.status
ORDER BY derniere_commande DESC;

-- =====================================================
-- ÉTAPE 2 : MISE À JOUR (à exécuter après vérification)
-- =====================================================
-- Cette requête marque effectivement les produits comme 'sold'

BEGIN;

UPDATE products
SET status = 'sold'
WHERE id IN (
    -- Sélectionner les IDs des produits qui ont des commandes actives
    SELECT DISTINCT p.id
    FROM products p
    INNER JOIN orders o ON o.product_id = p.id
    WHERE 
        -- Produits qui ont des commandes actives
        o.status IN ('pending', 'escrow_web2', 'shipped', 'completed')
        -- Exclure les commandes en litige ou annulées
        AND o.status != 'disputed'
        -- Pour les négociations, seulement si payées (escrow ouvert)
        AND (
            o.order_mode = 'direct' 
            OR (o.order_mode = 'negotiation' AND o.escrow_status = 'open')
            OR (o.order_mode = 'negotiation' AND o.status IN ('shipped', 'completed'))
        )
        -- Uniquement les produits pas encore marqués comme vendus
        AND (p.status = 'available' OR p.status IS NULL)
);

-- Afficher le nombre de produits mis à jour
SELECT COUNT(*) as produits_marques_comme_vendus
FROM products
WHERE status = 'sold';

COMMIT;

-- =====================================================
-- ÉTAPE 3 : VÉRIFICATION FINALE
-- =====================================================
-- Vérifier qu'il ne reste plus de produits 'available' avec des commandes actives

SELECT 
    COUNT(*) as produits_encore_disponibles_avec_commandes
FROM products p
INNER JOIN orders o ON o.product_id = p.id
WHERE 
    p.status = 'available'
    AND o.status IN ('pending', 'escrow_web2', 'shipped', 'completed')
    AND o.status != 'disputed'
    AND (
        o.order_mode = 'direct' 
        OR (o.order_mode = 'negotiation' AND o.escrow_status = 'open')
        OR (o.order_mode = 'negotiation' AND o.status IN ('shipped', 'completed'))
    );

-- Si cette requête retourne 0, tout est bon ! ✅
-- Si elle retourne un nombre > 0, il reste des produits à corriger.






