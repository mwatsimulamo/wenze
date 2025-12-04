-- Migration: Add size field to products table for fashion category
-- Run this in your Supabase SQL Editor

-- Add size column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS size TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.size IS 'Size of the product (for fashion category only): XS, S, M, L, XL, XXL, XXXL';

-- Optional: Add a check constraint to ensure size is only for fashion items
-- Uncomment if you want to enforce this at database level
-- ALTER TABLE products
-- ADD CONSTRAINT check_size_fashion_only 
-- CHECK (
--   (category = 'fashion' AND size IS NOT NULL) OR 
--   (category != 'fashion' AND size IS NULL)
-- );






