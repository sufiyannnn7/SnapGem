-- Drop dependent tables
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.cart CASCADE;

-- Modify Orders Table
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_shipping_address_id_fkey;

ALTER TABLE public.orders DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS shipping_address_id;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Modify Reviews Table
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- Update RLS Policies
-- First, drop existing restrictive policies
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users read own timeline" ON public.order_timeline;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

-- Create anonymous access policies for orders (Admin reads all, Anon inserts)
CREATE POLICY "Anon insert orders" ON public.orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin read orders" ON public.orders FOR SELECT TO public USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE TO public USING (public.is_admin(auth.uid()));

-- Create anonymous access policies for order items
CREATE POLICY "Anon insert order items" ON public.order_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin read order items" ON public.order_items FOR SELECT TO public USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin update order items" ON public.order_items FOR UPDATE TO public USING (public.is_admin(auth.uid()));

-- Order Timeline
CREATE POLICY "Admin read timeline" ON public.order_timeline FOR SELECT TO public USING (public.is_admin(auth.uid()));

-- Reviews
CREATE POLICY "Anon insert reviews" ON public.reviews FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone read approved reviews" ON public.reviews FOR SELECT TO public USING (is_approved = true OR public.is_admin(auth.uid()));
