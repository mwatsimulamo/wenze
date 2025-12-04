-- Migration simple pour ajouter la colonne price_fc
-- Exécutez chaque instruction une par une dans Supabase SQL Editor

-- Étape 1 : Ajouter la colonne price_fc
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_fc NUMERIC;

-- Étape 2 : Mettre à jour les produits existants avec un prix FC calculé
UPDATE products SET price_fc = price_ada * 2400 WHERE price_fc IS NULL;







