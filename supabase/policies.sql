-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HELPER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- PROFILES
-- ==========================================
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());

-- ==========================================
-- ADMIN USERS
-- ==========================================
CREATE POLICY "Admins can view admin_users" ON public.admin_users FOR SELECT TO authenticated USING (public.is_admin());

-- ==========================================
-- PUBLIC TABLES (Categories, Products, Images, Banners, Settings)
-- ==========================================
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (status = 'active' AND deleted_at IS NULL);
CREATE POLICY "Public can view product_images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view settings" ON public.settings FOR SELECT USING (true);

-- Admin CRUD for Public Tables
CREATE POLICY "Admin all on categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin all on products" ON public.products FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin all on product_images" ON public.product_images FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin all on banners" ON public.banners FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin all on settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin());

-- ==========================================
-- PRIVATE USER DATA (Addresses, Wishlist, Cart, Notifications)
-- ==========================================
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users manage own wishlist" ON public.wishlist FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own cart" ON public.cart FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ==========================================
-- ORDERS & ORDER ITEMS
-- ==========================================
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins all on orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT TO authenticated USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);
CREATE POLICY "Admins all on order items" ON public.order_items FOR ALL TO authenticated USING (public.is_admin());
