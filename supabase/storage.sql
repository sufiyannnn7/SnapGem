-- ==========================================
-- STORAGE BUCKETS & POLICIES
-- ==========================================

-- 1. Create product-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT DO NOTHING;

-- 2. Storage Policies for product-images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'product-images' AND public.is_admin());
