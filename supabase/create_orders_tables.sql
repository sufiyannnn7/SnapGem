-- =====================================================================
-- CREATE ORDERS & ORDER ITEMS TABLES WITH RLS POLICIES
-- Execute this SQL script in your Supabase SQL Editor
-- =====================================================================

-- 1. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  notes TEXT,
  subtotal NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id TEXT,
  quantity INT DEFAULT 1,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "Public Create Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Manage Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Create Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Admin Manage Order Items" ON public.order_items;

-- 5. Public Insert & Read Policies
CREATE POLICY "Public Create Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Manage Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public Create Order Items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Manage Order Items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- 6. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
