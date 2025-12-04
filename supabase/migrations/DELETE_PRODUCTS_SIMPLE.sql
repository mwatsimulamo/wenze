-- ⚠️ SCRIPT SIMPLE POUR SUPPRIMER LES PRODUITS
-- Copiez et collez ce script dans l'éditeur SQL de Supabase

-- 1️⃣ D'ABORD: Voir ce qui sera supprimé
SELECT 
  pr.full_name as "Nom du vendeur",
  pr.email as "Email",
  p.id as "ID Produit",
  p.title as "Titre",
  p.price_ada as "Prix",
  p.created_at as "Date de publication"
FROM products p
JOIN profiles pr ON p.seller_id = pr.id
WHERE 
  pr.full_name ILIKE '%Olivier%M%' 
  OR pr.full_name ILIKE '%Kaota%'
ORDER BY p.created_at DESC;

-- 2️⃣ COMPTER combien de produits seront supprimés
SELECT 
  COUNT(*) as "Nombre de produits à supprimer"
FROM products p
JOIN profiles pr ON p.seller_id = pr.id
WHERE 
  pr.full_name ILIKE '%Olivier%M%' 
  OR pr.full_name ILIKE '%Kaota%';

-- 3️⃣ SUPPRIMER (À exécuter seulement si vous êtes sûr!)

-- A. Supprimer les messages des commandes liées
DELETE FROM messages
WHERE order_id IN (
  SELECT o.id
  FROM orders o
  JOIN products p ON o.product_id = p.id
  JOIN profiles pr ON p.seller_id = pr.id
  WHERE pr.full_name ILIKE '%Olivier%M%' OR pr.full_name ILIKE '%Kaota%'
);

-- B. Supprimer les ratings des commandes liées
DELETE FROM ratings
WHERE order_id IN (
  SELECT o.id
  FROM orders o
  JOIN products p ON o.product_id = p.id
  JOIN profiles pr ON p.seller_id = pr.id
  WHERE pr.full_name ILIKE '%Olivier%M%' OR pr.full_name ILIKE '%Kaota%'
);

-- C. Supprimer les commandes liées
DELETE FROM orders
WHERE product_id IN (
  SELECT p.id
  FROM products p
  JOIN profiles pr ON p.seller_id = pr.id
  WHERE pr.full_name ILIKE '%Olivier%M%' OR pr.full_name ILIKE '%Kaota%'
);

-- D. Supprimer les produits
DELETE FROM products
WHERE seller_id IN (
  SELECT id
  FROM profiles
  WHERE full_name ILIKE '%Olivier%M%' OR full_name ILIKE '%Kaota%'
);

-- 4️⃣ VÉRIFIER que tout est bien supprimé
SELECT 
  COUNT(*) as "Produits restants (doit être 0)"
FROM products p
JOIN profiles pr ON p.seller_id = pr.id
WHERE pr.full_name ILIKE '%Olivier%M%' OR pr.full_name ILIKE '%Kaota%';







