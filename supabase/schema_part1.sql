-- =============================================================================
-- PART 1: CORE SCHEMA MIGRATION (SUPABASE / POSTGRESQL)
-- Premium E-Commerce Platform - SnapGem Store
-- =============================================================================

-- 1. EXTENSIONS & HELPER FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TYPE public.admin_role AS ENUM ('admin', 'manager', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- 1. ADMIN USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.admin_role DEFAULT 'admin' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. STORE SETTINGS (Single Row Configuration Table)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name TEXT DEFAULT 'SnapGem Store' NOT NULL,
  logo_url TEXT,
  favicon_url TEXT,
  whatsapp_number TEXT DEFAULT '918669210030',
  contact_email TEXT DEFAULT 'contact@snapgem.com',
  contact_number TEXT DEFAULT '+91 8669210030',
  business_address TEXT,
  currency_symbol TEXT DEFAULT '₹',
  currency_code TEXT DEFAULT 'INR',
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#3b82f6',
  footer_text TEXT DEFAULT '© 2026 SnapGem Store. All rights reserved.',
  announcement_bar_active BOOLEAN DEFAULT false,
  announcement_text TEXT DEFAULT 'Welcome to SnapGem Store!',
  announcement_link TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. CATEGORIES (Parent-Child Hierarchy)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand TEXT,
  description TEXT,
  base_price DECIMAL(12,2) DEFAULT 0 NOT NULL,
  compare_at_price DECIMAL(12,2),
  stock INTEGER DEFAULT 0 NOT NULL,
  sku TEXT UNIQUE,
  thumbnail TEXT,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  is_trending BOOLEAN DEFAULT false NOT NULL,
  is_best_seller BOOLEAN DEFAULT false NOT NULL,
  is_new_arrival BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  tags TEXT[],
  specifications JSONB DEFAULT '{}'::jsonb NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. PRODUCT IMAGES (Unlimited Gallery Support)
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. PRODUCT VARIANTS (Future Variant & Stock Support)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  price DECIMAL(12,2),
  compare_at_price DECIMAL(12,2),
  stock INTEGER DEFAULT 0 NOT NULL,
  image_url TEXT,
  attributes JSONB DEFAULT '{}'::jsonb NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- 3. INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_trending ON public.products(is_trending);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);

-- =============================================================================
-- 4. TRIGGERS FOR AUTOMATIC UPDATED_AT TIMESTAMPING
-- =============================================================================
DROP TRIGGER IF EXISTS update_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 5. DEFAULT STORE SETTINGS SEED (SINGLE ROW CONSTRAINT)
-- =============================================================================
INSERT INTO public.store_settings (
  id, site_name, whatsapp_number, contact_email, contact_number, currency_symbol, currency_code
) VALUES (
  1, 'SnapGem Store', '918669210030', 'contact@snapgem.com', '+91 8669210030', '₹', 'INR'
) ON CONFLICT (id) DO NOTHING;
