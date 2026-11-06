-- ==========================================
-- HELPER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ENABLE RLS
-- ==========================================
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PUBLIC TABLES (Readable by everyone)
-- ==========================================
CREATE POLICY "Public read store_settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public read homepage_sections" ON public.homepage_sections FOR SELECT USING (is_enabled = true);
CREATE POLICY "Public read published pages" ON public.pages FOR SELECT USING (is_published = true);
CREATE POLICY "Public read published blog_posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Public read attributes" ON public.attributes FOR SELECT USING (true);
CREATE POLICY "Public read attribute_values" ON public.attribute_values FOR SELECT USING (true);
CREATE POLICY "Public read product_attributes" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Public read product_variants" ON public.product_variants FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read variant_attribute_values" ON public.variant_attribute_values FOR SELECT USING (true);

-- ==========================================
-- STAFF / ADMIN PRIVILEGES
-- ==========================================
-- Staff can manage almost all CMS tables
CREATE POLICY "Staff all on media_library" ON public.media_library FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on homepage_sections" ON public.homepage_sections FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on pages" ON public.pages FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on blog_posts" ON public.blog_posts FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on attributes" ON public.attributes FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on attribute_values" ON public.attribute_values FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on product_attributes" ON public.product_attributes FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on product_variants" ON public.product_variants FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on variant_attribute_values" ON public.variant_attribute_values FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on coupons" ON public.coupons FOR ALL TO authenticated USING (public.is_staff_or_admin());
CREATE POLICY "Staff all on order_timeline" ON public.order_timeline FOR ALL TO authenticated USING (public.is_staff_or_admin());

-- Only Admins can modify store_settings
CREATE POLICY "Admin all on store_settings" ON public.store_settings FOR ALL TO authenticated USING (public.is_admin());
