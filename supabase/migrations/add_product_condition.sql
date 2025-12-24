-- Migration: Ajout du champ condition pour indiquer si un produit est nouveau ou d'occasion
-- Date: 2024

-- Ajouter la colonne condition pour distinguer nouveau et occasion
ALTER TABLE products
ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('new', 'used')) DEFAULT 'new';

-- Commentaire pour documentation
COMMENT ON COLUMN products.condition IS 'État du produit: new (nouveau) ou used (occasion)';

