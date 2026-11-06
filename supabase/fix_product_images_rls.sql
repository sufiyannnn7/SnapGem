-- =====================================================================
-- FIX ROW LEVEL SECURITY (RLS) POLICIES FOR PRODUCT_IMAGES & PRODUCT_VARIANTS
-- Execute this SQL script in your Supabase SQL Editor
-- =====================================================================

-- 1. Enable RLS on product_images and product_variants
ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_variants ENABLE ROW LEVEL SECURITY;

-- 2. Drop any old restrictive policies
DROP POLICY IF EXISTS "Public Read Product Images" ON public.product_images;
DROP POLICY IF EXISTS "Admin Manage Product Images" ON public.product_images;
DROP POLICY IF EXISTS "Allow All Product Images" ON public.product_images;

DROP POLICY IF EXISTS "Public Read Product Variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admin Manage Product Variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow All Product Variants" ON public.product_variants;

-- 3. Create permissive policies for product_images
CREATE POLICY "Public Read Product Images" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Allow All Product Images" ON public.product_images
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Create permissive policies for product_variants
CREATE POLICY "Public Read Product Variants" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "Allow All Product Variants" ON public.product_variants
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Reload schema cache
NOTIFY pgrst, 'reload schema';
