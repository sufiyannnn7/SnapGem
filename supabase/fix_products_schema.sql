-- =====================================================================
-- COMPLETE PRODUCTS TABLE SCHEMA & COLUMNS FIX
-- Execute this SQL script in your Supabase SQL Editor
-- =====================================================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS selling_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS mrp NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS thumbnail TEXT,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Notify PostgREST to immediately reload schema cache
NOTIFY pgrst, 'reload schema';
