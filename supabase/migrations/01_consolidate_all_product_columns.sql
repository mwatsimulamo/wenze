-- Migration consolidée: Ajout de toutes les colonnes nécessaires pour les produits
-- Cette migration regroupe toutes les colonnes ajoutées progressivement
-- Date: 2024
-- 
-- IMPORTANT: Exécutez cette migration dans l'éditeur SQL de Supabase
-- Cette migration utilise IF NOT EXISTS, donc elle peut être exécutée plusieurs fois sans erreur

-- 1. Colonnes pour la catégorie Mode (fashion)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS fashion_type TEXT;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS shoe_number TEXT;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS size TEXT;

-- 2. Colonne pour l'état du produit (nouveau/occasion)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('new', 'used')) DEFAULT 'new';

-- 3. Colonnes pour les prix (FC et prix négociables)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_fc NUMERIC;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'negotiable'));

ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_min NUMERIC;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_max NUMERIC;

-- 4. Colonnes pour les contacts (services, immobilier, auto)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 5. Colonne pour la disponibilité des services
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Commentaires pour documentation
COMMENT ON COLUMN products.fashion_type IS 'Type de produit mode: habit ou soulier';
COMMENT ON COLUMN products.shoe_number IS 'Numéro de chaussure (taille européenne)';
COMMENT ON COLUMN products.size IS 'Taille du produit (pour la mode): XS, S, M, L, XL, XXL, XXXL';
COMMENT ON COLUMN products.condition IS 'État du produit: new (nouveau) ou used (occasion)';
COMMENT ON COLUMN products.price_fc IS 'Prix fixe en Francs Congolais (FC). Cette valeur reste constante alors que price_ada varie selon les taux de marché.';
COMMENT ON COLUMN products.price_type IS 'Type de prix: fixed (prix fixe) ou negotiable (prix négociable entre min et max)';
COMMENT ON COLUMN products.price_min IS 'Prix minimum si price_type est negotiable';
COMMENT ON COLUMN products.price_max IS 'Prix maximum si price_type est negotiable';
COMMENT ON COLUMN products.contact_whatsapp IS 'Numéro WhatsApp pour contact (requis pour les services)';
COMMENT ON COLUMN products.contact_email IS 'Adresse email pour contact (requis pour les services)';
COMMENT ON COLUMN products.is_available IS 'Statut de disponibilité pour les services (true = disponible, false = indisponible)';

