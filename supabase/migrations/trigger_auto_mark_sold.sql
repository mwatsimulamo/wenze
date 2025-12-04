-- =====================================================
-- TRIGGER : Marquer automatiquement les produits comme vendus
-- =====================================================
-- 
-- Ce trigger marque automatiquement un produit comme 'sold'
-- dès qu'une commande est créée avec un statut actif.
-- Cela garantit que les produits vendus disparaissent
-- immédiatement du marché.
-- =====================================================

-- Fonction qui marque le produit comme vendu
CREATE OR REPLACE FUNCTION mark_product_as_sold()
RETURNS TRIGGER AS $$
BEGIN
    -- Marquer le produit comme vendu si la commande est active
    IF NEW.status IN ('pending', 'escrow_web2', 'shipped', 'completed') 
       AND NEW.status != 'disputed' THEN
        
        -- Pour les négociations, vérifier que l'escrow est ouvert ou que c'est déjà expédié/complété
        IF NEW.order_mode = 'direct' 
           OR (NEW.order_mode = 'negotiation' AND NEW.escrow_status = 'open')
           OR (NEW.order_mode = 'negotiation' AND NEW.status IN ('shipped', 'completed')) THEN
            
            UPDATE products
            SET status = 'sold'
            WHERE id = NEW.product_id
            AND (status = 'available' OR status IS NULL);
            
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger qui se déclenche après INSERT ou UPDATE d'une commande
CREATE TRIGGER auto_mark_product_sold_on_order
AFTER INSERT OR UPDATE OF status, escrow_status ON orders
FOR EACH ROW
EXECUTE FUNCTION mark_product_as_sold();

-- Commentaire explicatif
COMMENT ON FUNCTION mark_product_as_sold() IS 
'Marque automatiquement un produit comme vendu dès qu''une commande active est créée ou mise à jour';






