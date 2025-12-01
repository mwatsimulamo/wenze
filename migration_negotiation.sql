-- Migration: Ajout des colonnes de négociation de prix
-- À exécuter sur votre base Supabase si la table orders existe déjà

-- Ajouter les colonnes pour le système de négociation
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_mode text DEFAULT 'direct' CHECK (order_mode IN ('direct', 'negotiation')),
ADD COLUMN IF NOT EXISTS proposed_price numeric,
ADD COLUMN IF NOT EXISTS final_price numeric,
ADD COLUMN IF NOT EXISTS escrow_status text CHECK (escrow_status IN ('open', 'cancelled', 'released'));

-- Commentaires pour documentation
COMMENT ON COLUMN orders.order_mode IS 'Mode de commande: direct (achat direct) ou negotiation (négociation de prix)';
COMMENT ON COLUMN orders.proposed_price IS 'Montant proposé et bloqué en escrow par l''acheteur';
COMMENT ON COLUMN orders.final_price IS 'Prix final accepté par les deux parties';
COMMENT ON COLUMN orders.escrow_status IS 'Statut de l''escrow: open (ouvert), cancelled (annulé), released (libéré)';

