-- Script pour supprimer les produits de vendeurs spécifiques
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- ÉTAPE 1: Vérifier d'abord quels produits seront supprimés (Sécurité)
-- Décommentez cette partie pour voir les produits avant suppression

/*
SELECT 
  p.id as product_id,
  p.title,
  p.price_ada,
  p.category,
  p.created_at,
  pr.full_name as seller_name,
  pr.email as seller_email
FROM products p
JOIN profiles pr ON p.seller_id = pr.id
WHERE 
  pr.full_name ILIKE '%Olivier%M%' 
  OR pr.full_name ILIKE '%Kaota%'
  OR pr.full_name ILIKE '%olivier m%'
ORDER BY p.created_at DESC;
*/

-- ÉTAPE 2: Compter les produits qui seront supprimés
SELECT 
  COUNT(*) as total_products_to_delete,
  pr.full_name as seller_name
FROM products p
JOIN profiles pr ON p.seller_id = pr.id
WHERE 
  pr.full_name ILIKE '%Olivier%M%' 
  OR pr.full_name ILIKE '%Kaota%'
  OR pr.full_name ILIKE '%olivier m%'
GROUP BY pr.full_name;

-- ÉTAPE 3: Vérifier s'il y a des commandes liées à ces produits (Important!)
SELECT 
  COUNT(*) as total_orders,
  o.status,
  pr.full_name as seller_name
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN profiles pr ON p.seller_id = pr.id
WHERE 
  (pr.full_name ILIKE '%Olivier%M%' 
   OR pr.full_name ILIKE '%Kaota%'
   OR pr.full_name ILIKE '%olivier m%')
GROUP BY o.status, pr.full_name;

-- ============================================================
-- SUPPRESSION (À exécuter seulement après vérification)
-- ============================================================

-- OPTION A: Supprimer les produits (et les commandes associées en cascade si configuré)
-- ATTENTION: Cela supprimera également les commandes liées si les foreign keys sont configurées en CASCADE

BEGIN;

-- Supprimer d'abord les messages liés aux commandes de ces produits
DELETE FROM messages
WHERE order_id IN (
  SELECT o.id
  FROM orders o
  JOIN products p ON o.product_id = p.id
  JOIN profiles pr ON p.seller_id = pr.id
  WHERE 
    pr.full_name ILIKE '%Olivier%M%' 
    OR pr.full_name ILIKE '%Kaota%'
    OR pr.full_name ILIKE '%olivier m%'
);

-- Supprimer les ratings liés aux commandes de ces produits
DELETE FROM ratings
WHERE order_id IN (
  SELECT o.id
  FROM orders o
  JOIN products p ON o.product_id = p.id
  JOIN profiles pr ON p.seller_id = pr.id
  WHERE 
    pr.full_name ILIKE '%Olivier%M%' 
    OR pr.full_name ILIKE '%Kaota%'
    OR pr.full_name ILIKE '%olivier m%'
);

-- Supprimer les commandes liées à ces produits
DELETE FROM orders
WHERE product_id IN (
  SELECT p.id
  FROM products p
  JOIN profiles pr ON p.seller_id = pr.id
  WHERE 
    pr.full_name ILIKE '%Olivier%M%' 
    OR pr.full_name ILIKE '%Kaota%'
    OR pr.full_name ILIKE '%olivier m%'
);

-- Enfin, supprimer les produits eux-mêmes
DELETE FROM products
WHERE seller_id IN (
  SELECT id
  FROM profiles
  WHERE 
    full_name ILIKE '%Olivier%M%' 
    OR full_name ILIKE '%Kaota%'
    OR full_name ILIKE '%olivier m%'
);

-- Vérifier le résultat
SELECT 
  COUNT(*) as products_deleted
FROM products
WHERE seller_id IN (
  SELECT id
  FROM profiles
  WHERE 
    full_name ILIKE '%Olivier%M%' 
    OR full_name ILIKE '%Kaota%'
    OR full_name ILIKE '%olivier m%'
);

COMMIT;

-- ============================================================
-- OPTION B: Supprimer par ID de vendeur spécifique (Plus précis)
-- ============================================================

-- Remplacez 'VENDOR_ID_1' et 'VENDOR_ID_2' par les vrais IDs des vendeurs
/*
BEGIN;

DELETE FROM messages
WHERE order_id IN (
  SELECT o.id FROM orders o
  WHERE o.product_id IN (
    SELECT id FROM products WHERE seller_id IN ('VENDOR_ID_1', 'VENDOR_ID_2')
  )
);

DELETE FROM ratings
WHERE order_id IN (
  SELECT o.id FROM orders o
  WHERE o.product_id IN (
    SELECT id FROM products WHERE seller_id IN ('VENDOR_ID_1', 'VENDOR_ID_2')
  )
);

DELETE FROM orders
WHERE product_id IN (
  SELECT id FROM products WHERE seller_id IN ('VENDOR_ID_1', 'VENDOR_ID_2')
);

DELETE FROM products
WHERE seller_id IN ('VENDOR_ID_1', 'VENDOR_ID_2');

COMMIT;
*/

-- ============================================================
-- OPTION C: Supprimer par nom exact (Plus sûr)
-- ============================================================

-- Trouver d'abord les IDs exacts
/*
SELECT id, full_name, email
FROM profiles
WHERE full_name IN ('Olivier M', 'Kaota', 'olivier M', 'KAOTA')
   OR full_name ILIKE 'Olivier M%'
   OR full_name ILIKE 'Kaota%';
*/

-- Ensuite utilisez ces IDs dans l'OPTION B












