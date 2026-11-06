-- =============================================================================
-- COMPLETE MIGRATION SQL FOR E-COMMERCE PLATFORM (SUPABASE / POSTGRESQL)
-- Safe, Idempotent, Production-Ready Migration
-- =============================================================================

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DO $$ BEGIN
    CREATE TYPE public.admin_role AS ENUM ('admin', 'manager', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.homepage_section_type AS ENUM ('hero', 'featured_collections', 'trending_products', 'flash_sale', 'new_arrivals', 'testimonials', 'newsletter', 'custom_html');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. CREATE TABLES & ADD MISSING COLUMNS
-- =============================================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMIN USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.admin_role DEFAULT 'admin' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name TEXT DEFAULT 'LUXE Store',
  contact_email TEXT DEFAULT 'support@example.com',
  contact_number TEXT DEFAULT '+1234567890',
  whatsapp_number TEXT DEFAULT '1234567890',
  business_address TEXT,
  currency_symbol TEXT DEFAULT '$',
  currency_code TEXT DEFAULT 'USD',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#3b82f6',
  footer_text TEXT DEFAULT '© 2026 LUXE Store. All rights reserved.',
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  base_shipping_charge DECIMAL(10,2) DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2) DEFAULT 0,
  delivery_time_text TEXT DEFAULT '3-5 Business Days',
  announcement_bar_active BOOLEAN DEFAULT false,
  announcement_text TEXT DEFAULT 'Welcome to our store! Free shipping on orders over $50.',
  announcement_link TEXT,
  maintenance_mode BOOLEAN DEFAULT false,
  seo_title TEXT DEFAULT 'LUXE Store - Premium E-Commerce',
  seo_description TEXT DEFAULT 'Discover luxury products at amazing prices.',
  seo_keywords TEXT,
  google_analytics_id TEXT,
  google_site_verification TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- HOMEPAGE SECTIONS
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type public.homepage_section_type NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PAGES
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- MEDIA LIBRARY
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  folder TEXT DEFAULT 'uncategorized',
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  alt_text TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  thumbnail TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_at_price DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  is_featured BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  tags TEXT[],
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure all columns on products exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ATTRIBUTES
CREATE TABLE IF NOT EXISTS public.attributes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'select',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ATTRIBUTE VALUES
CREATE TABLE IF NOT EXISTS public.attribute_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PRODUCT ATTRIBUTES
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE
);

-- PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  stock INTEGER DEFAULT 0 NOT NULL,
  image_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- VARIANT ATTRIBUTE VALUES
CREATE TABLE IF NOT EXISTS public.variant_attribute_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  attribute_value_id UUID NOT NULL REFERENCES public.attribute_values(id) ON DELETE CASCADE
);

-- WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CART
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'India' NOT NULL,
  is_default BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  notes TEXT,
  subtotal DECIMAL(10,2) DEFAULT 0 NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0 NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0 NOT NULL,
  total DECIMAL(10,2) DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure all order columns exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ORDER TIMELINE
CREATE TABLE IF NOT EXISTS public.order_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name TEXT DEFAULT 'Guest' NOT NULL,
  reviewer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_amount DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2),
  min_purchase DECIMAL(10,2) DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BANNERS
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- 3. INDEXES FOR PERFORMANCE & RELATIONS
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_media_folder ON public.media_library(folder);

-- =============================================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- =============================================================================
DROP TRIGGER IF EXISTS update_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pages_updated_at ON public.pages;
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper RLS functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissive Public Policies for Anonymous Storefront + Authenticated Admin CRUD
DROP POLICY IF EXISTS "Public read store_settings" ON public.store_settings;
CREATE POLICY "Public read store_settings" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify store_settings" ON public.store_settings;
CREATE POLICY "Admin modify store_settings" ON public.store_settings FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read homepage_sections" ON public.homepage_sections;
CREATE POLICY "Public read homepage_sections" ON public.homepage_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admin modify homepage_sections" ON public.homepage_sections FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify categories" ON public.categories;
CREATE POLICY "Admin modify categories" ON public.categories FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify products" ON public.products;
CREATE POLICY "Admin modify products" ON public.products FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
CREATE POLICY "Public read product_images" ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify product_images" ON public.product_images;
CREATE POLICY "Admin modify product_images" ON public.product_images FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read product_variants" ON public.product_variants;
CREATE POLICY "Public read product_variants" ON public.product_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify product_variants" ON public.product_variants;
CREATE POLICY "Admin modify product_variants" ON public.product_variants FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify orders" ON public.orders;
CREATE POLICY "Admin modify orders" ON public.orders FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
CREATE POLICY "Public read order_items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify order_items" ON public.order_items;
CREATE POLICY "Admin modify order_items" ON public.order_items FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read pages" ON public.pages;
CREATE POLICY "Public read pages" ON public.pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify pages" ON public.pages;
CREATE POLICY "Admin modify pages" ON public.pages FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read banners" ON public.banners;
CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify banners" ON public.banners;
CREATE POLICY "Admin modify banners" ON public.banners FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert reviews" ON public.reviews;
CREATE POLICY "Public insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin modify reviews" ON public.reviews;
CREATE POLICY "Admin modify reviews" ON public.reviews FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify coupons" ON public.coupons;
CREATE POLICY "Admin modify coupons" ON public.coupons FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read media_library" ON public.media_library;
CREATE POLICY "Public read media_library" ON public.media_library FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify media_library" ON public.media_library;
CREATE POLICY "Admin modify media_library" ON public.media_library FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Read admin_users" ON public.admin_users;
CREATE POLICY "Read admin_users" ON public.admin_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert admin_users" ON public.admin_users;
CREATE POLICY "Insert admin_users" ON public.admin_users FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 6. DEFAULT SEED DATA
-- =============================================================================

-- Default Store Settings
INSERT INTO public.store_settings (
  id, site_name, contact_email, contact_number, whatsapp_number, currency_symbol, currency_code, primary_color, secondary_color, accent_color, footer_text
) VALUES (
  1, 'LUXE Store', 'support@luxe.com', '+1234567890', '1234567890', '$', 'USD', '#000000', '#ffffff', '#3b82f6', '© 2026 LUXE Store. All rights reserved.'
) ON CONFLICT (id) DO UPDATE SET
  site_name = EXCLUDED.site_name,
  whatsapp_number = EXCLUDED.whatsapp_number;

-- Default Homepage Sections
INSERT INTO public.homepage_sections (section_type, display_order, is_enabled, settings)
SELECT 'hero', 0, true, '{"title": "Spring / Summer Collection 2026", "subtitle": "ELEVATE YOUR EVERYDAY", "button_text": "Explore Collection", "button_link": "/shop"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_sections WHERE section_type = 'hero');

INSERT INTO public.homepage_sections (section_type, display_order, is_enabled, settings)
SELECT 'featured_collections', 1, true, '{"title": "Shop by Category", "subtitle": "Curated collections for your style"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_sections WHERE section_type = 'featured_collections');

INSERT INTO public.homepage_sections (section_type, display_order, is_enabled, settings)
SELECT 'trending_products', 2, true, '{"title": "Trending Products", "subtitle": "Our most popular items this week"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_sections WHERE section_type = 'trending_products');

INSERT INTO public.homepage_sections (section_type, display_order, is_enabled, settings)
SELECT 'newsletter', 3, true, '{"title": "Join Our Newsletter", "subtitle": "Get 15% off your first order"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_sections WHERE section_type = 'newsletter');

-- Default Categories
INSERT INTO public.categories (name, slug, description, image_url, display_order, is_active, is_featured)
VALUES 
  ('Clothing', 'clothing', 'Luxury apparel and fashion statement pieces', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80', 1, true, true),
  ('Accessories', 'accessories', 'Premium bags, jewelry, and watches', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80', 2, true, true),
  ('Footwear', 'footwear', 'Designer shoes and sneakers', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80', 3, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Default Banners
INSERT INTO public.banners (title, subtitle, image_url, link_url, display_order, is_active)
VALUES 
  ('Exclusive Summer Sale', 'Up to 40% off selected luxury items', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80', '/shop', 1, true)
ON CONFLICT DO NOTHING;

-- Default CMS Pages
INSERT INTO public.pages (slug, title, content, is_published, seo_title, seo_description)
VALUES 
  ('about-us', 'About LUXE', '<h2>Our Story</h2><p>Welcome to LUXE, your destination for modern luxury and timeless design.</p>', true, 'About Us - LUXE', 'Learn about LUXE history and vision.'),
  ('privacy-policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>We respect your privacy and protect your personal information.</p>', true, 'Privacy Policy - LUXE', 'LUXE Privacy Policy and Data Protection.'),
  ('terms-of-service', 'Terms of Service', '<h2>Terms of Service</h2><p>Terms and conditions for using LUXE services.</p>', true, 'Terms of Service - LUXE', 'LUXE Terms of Service.')
ON CONFLICT (slug) DO NOTHING;

-- Storage Bucket Setup for 'media' and 'product-images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public read storage media" ON storage.objects;
CREATE POLICY "Public read storage media" ON storage.objects FOR SELECT USING (bucket_id IN ('media', 'product-images'));

DROP POLICY IF EXISTS "Public upload storage media" ON storage.objects;
CREATE POLICY "Public upload storage media" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('media', 'product-images'));

DROP POLICY IF EXISTS "Public modify storage media" ON storage.objects;
CREATE POLICY "Public modify storage media" ON storage.objects FOR UPDATE USING (bucket_id IN ('media', 'product-images'));

DROP POLICY IF EXISTS "Public delete storage media" ON storage.objects;
CREATE POLICY "Public delete storage media" ON storage.objects FOR DELETE USING (bucket_id IN ('media', 'product-images'));
