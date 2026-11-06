-- =====================================================================
-- ADD MRP COLUMN TO PRODUCTS TABLE
-- Execute this SQL script in your Supabase SQL Editor
-- =====================================================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS mrp NUMERIC DEFAULT 0;

-- Optional: reload schema cache
NOTIFY pgrst, 'reload schema';
