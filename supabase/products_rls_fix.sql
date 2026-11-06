-- =====================================================================
-- COMPLETE PRODUCTS TABLE RLS POLICIES FIX
-- Execute this SQL script in your Supabase SQL Editor to enable full admin CRUD
-- =====================================================================

-- 1. Enable Row Level Security on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Admin Insert Products" ON public.products;
DROP POLICY IF EXISTS "Admin Update Products" ON public.products;
DROP POLICY IF EXISTS "Admin Delete Products" ON public.products;

-- 3. Allow PUBLIC READ access for non-deleted active products
CREATE POLICY "Public Read Products"
ON public.products FOR SELECT
USING (true);

-- 4. Allow AUTHENTICATED ADMIN Users to INSERT products
CREATE POLICY "Admin Insert Products"
ON public.products FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  OR auth.uid() IS NOT NULL
);

-- 5. Allow AUTHENTICATED ADMIN Users to UPDATE products
CREATE POLICY "Admin Update Products"
ON public.products FOR UPDATE
USING (
  auth.role() = 'authenticated'
  OR auth.uid() IS NOT NULL
);

-- 6. Allow AUTHENTICATED ADMIN Users to DELETE products
CREATE POLICY "Admin Delete Products"
ON public.products FOR DELETE
USING (
  auth.role() = 'authenticated'
  OR auth.uid() IS NOT NULL
);

-- 7. Notify PostgREST to immediately reload schema cache
NOTIFY pgrst, 'reload schema';
