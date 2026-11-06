-- ==========================================
-- SUPABASE E-COMMERCE FULL MIGRATION SCRIPT
-- ==========================================
-- Idempotent, robust, and production-ready.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 3. ENUMS
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('admin', 'manager', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE homepage_section_type AS ENUM ('hero', 'featured_collections', 'trending_products', 'flash_sale', 'new_arrivals', 'testimonials', 'newsletter', 'custom_html', 'banner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. TABLES (Ordered by dependencies)

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ADMIN USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role DEFAULT 'staff' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name TEXT DEFAULT 'My Store',
  contact_email TEXT,
  contact_number TEXT,
  whatsapp_number TEXT,
  business_address TEXT,
  currency_symbol TEXT DEFAULT '$',
  currency_code TEXT DEFAULT 'USD',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#3b82f6',
  maintenance_mode BOOLEAN DEFAULT false,
  announcement_bar_active BOOLEAN DEFAULT false,
  announcement_text TEXT,
  seo_title TEXT,
  seo_description TEXT,
  shipping_base_charge DECIMAL(10,2) DEFAULT 0,
  shipping_free_threshold DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- HOMEPAGE SECTIONS
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_type homepage_section_type NOT NULL,
  display_order INTEGER NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_homepage_sections_updated_at ON public.homepage_sections;
CREATE TRIGGER update_homepage_sections_updated_at BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BANNERS
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PAGES
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT, 
  is_published BOOLEAN DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_pages_updated_at ON public.pages;
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MEDIA LIBRARY
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url TEXT NOT NULL,
  folder TEXT DEFAULT 'uncategorized',
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_folder ON public.media_library(folder);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories(deleted_at);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  status TEXT DEFAULT 'active', 
  is_featured BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug) WHERE deleted_at IS NULL;

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

-- ATTRIBUTES
CREATE TABLE IF NOT EXISTS public.attributes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, 
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ATTRIBUTE VALUES
CREATE TABLE IF NOT EXISTS public.attribute_values (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  attribute_id UUID REFERENCES public.attributes(id) ON DELETE CASCADE NOT NULL,
  value TEXT NOT NULL, 
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(attribute_id, value)
);

-- PRODUCT ATTRIBUTES (M-to-M)
CREATE TABLE IF NOT EXISTS public.product_attributes (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  attribute_id UUID REFERENCES public.attributes(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (product_id, attribute_id)
);

-- PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sku TEXT UNIQUE,
  price DECIMAL(10,2), 
  compare_at_price DECIMAL(10,2),
  stock INTEGER DEFAULT 0 NOT NULL,
  image_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id) WHERE deleted_at IS NULL;

-- VARIANT ATTRIBUTE VALUES (M-to-M)
CREATE TABLE IF NOT EXISTS public.variant_attribute_values (
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  attribute_value_id UUID REFERENCES public.attribute_values(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (variant_id, attribute_value_id)
);

-- WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);

-- CART
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE, 
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, product_id, variant_id)
);
DROP TRIGGER IF EXISTS update_cart_updated_at ON public.cart;
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON public.cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart(user_id);

-- ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id) WHERE deleted_at IS NULL;

-- COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type discount_type NOT NULL, 
  discount_amount DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL, 
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0 NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0 NOT NULL,
  coupon_code TEXT,
  total DECIMAL(10,2) NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  payment_status payment_status DEFAULT 'pending' NOT NULL,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status) WHERE deleted_at IS NULL;

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL, 
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ORDER TIMELINE
CREATE TABLE IF NOT EXISTS public.order_timeline (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  status order_status NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  comment TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);


-- ==========================================
-- 5. RLS AND POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read/write their own, Admins can read all
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admin Users: Only admins can read/write
DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
CREATE POLICY "Admins can read admin_users" ON public.admin_users FOR SELECT USING (public.is_admin(auth.uid()));

-- Read-only for public, Full access for Admins:
-- store_settings, homepage_sections, banners, pages, categories, products, product_images, attributes, attribute_values, product_attributes, product_variants, variant_attribute_values, reviews

DO $$ 
DECLARE
  table_name text;
  tables text[] := ARRAY['store_settings', 'homepage_sections', 'banners', 'pages', 'categories', 'products', 'product_images', 'attributes', 'attribute_values', 'product_attributes', 'product_variants', 'variant_attribute_values'];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read access" ON public.%I', table_name);
    EXECUTE format('CREATE POLICY "Public read access" ON public.%I FOR SELECT USING (true)', table_name);
    
    EXECUTE format('DROP POLICY IF EXISTS "Admin write access" ON public.%I', table_name);
    EXECUTE format('CREATE POLICY "Admin write access" ON public.%I FOR ALL USING (public.is_admin(auth.uid()))', table_name);
  END LOOP;
END $$;

-- Reviews (Public can insert if authenticated)
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin full access reviews" ON public.reviews;
CREATE POLICY "Admin full access reviews" ON public.reviews FOR ALL USING (public.is_admin(auth.uid()));

-- Wishlist, Cart, Addresses, Notifications (Users can read/write their own)
DO $$ 
DECLARE
  table_name text;
  tables text[] := ARRAY['wishlist', 'cart', 'addresses', 'notifications'];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users manage own %I" ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users manage own %I" ON public.%I FOR ALL USING (auth.uid() = user_id)', table_name, table_name);
  END LOOP;
END $$;

-- Orders & Order Items & Timeline (Users can read own, Admin full access)
DO $$ 
DECLARE
  table_name text;
  tables text[] := ARRAY['orders'];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users read own %I" ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users read own %I" ON public.%I FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()))', table_name, table_name);
    
    EXECUTE format('DROP POLICY IF EXISTS "Users insert own %I" ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY "Users insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()))', table_name, table_name);
    
    EXECUTE format('DROP POLICY IF EXISTS "Admin write %I" ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY "Admin write %I" ON public.%I FOR UPDATE USING (public.is_admin(auth.uid()))', table_name, table_name);
  END LOOP;
END $$;

-- Order Items & Timeline Policy logic
DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users read own timeline" ON public.order_timeline;
CREATE POLICY "Users read own timeline" ON public.order_timeline FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admin timeline access" ON public.order_timeline;
CREATE POLICY "Admin timeline access" ON public.order_timeline FOR ALL USING (public.is_admin(auth.uid()));

-- Media Library
DROP POLICY IF EXISTS "Public read media" ON public.media_library;
CREATE POLICY "Public read media" ON public.media_library FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write media" ON public.media_library;
CREATE POLICY "Admin write media" ON public.media_library FOR ALL USING (public.is_admin(auth.uid()));

-- Coupons
DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Admin manage coupons" ON public.coupons FOR ALL USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users read active coupons" ON public.coupons;
CREATE POLICY "Users read active coupons" ON public.coupons FOR SELECT USING (is_active = true);


-- ==========================================
-- 6. STORAGE BUCKET
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Media" ON storage.objects;
CREATE POLICY "Public Access Media" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Admin Upload Media" ON storage.objects;
CREATE POLICY "Admin Upload Media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin Update Media" ON storage.objects;
CREATE POLICY "Admin Update Media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin Delete Media" ON storage.objects;
CREATE POLICY "Admin Delete Media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND public.is_admin(auth.uid()));
