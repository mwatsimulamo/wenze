-- Migration: Ajouter la politique RLS pour permettre aux vendeurs de supprimer leurs propres produits
-- Date: 2024

-- Supprimer la politique existante si elle existe (pour éviter les doublons)
DROP POLICY IF EXISTS "Sellers can delete their own products" ON products;

-- Créer la politique pour permettre aux vendeurs de supprimer leurs propres produits
CREATE POLICY "Sellers can delete their own products"
ON products
FOR DELETE
USING (auth.uid() = seller_id);

-- Commentaire
COMMENT ON POLICY "Sellers can delete their own products" ON products IS 
'Permet aux vendeurs de supprimer uniquement leurs propres produits.';






