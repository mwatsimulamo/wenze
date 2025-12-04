-- Migration: Add contact fields for services
-- Run this in your Supabase SQL Editor

-- Add contact_whatsapp column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;

-- Add contact_email column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.contact_whatsapp IS 'WhatsApp number for service contact (required for services)';
COMMENT ON COLUMN products.contact_email IS 'Email address for service contact (required for services)';






