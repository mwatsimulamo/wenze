-- Migration: Ajout des champs pour la catégorie Mode
-- Date: 2024

-- Ajouter la colonne fashion_type pour distinguer Habit et Soulier
ALTER TABLE products
ADD COLUMN IF NOT EXISTS fashion_type TEXT;

-- Ajouter la colonne shoe_number pour le numéro des souliers
ALTER TABLE products
ADD COLUMN IF NOT EXISTS shoe_number TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN products.fashion_type IS 'Type de produit mode: habit ou soulier';
COMMENT ON COLUMN products.shoe_number IS 'Numéro de chaussure (taille européenne)';






