-- =====================================================================
-- COMPLETE STORE SETTINGS TABLE SCHEMA FIX
-- Execute this SQL script in your Supabase SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'SnapGem Store',
  contact_email TEXT,
  contact_number TEXT,
  whatsapp_number TEXT DEFAULT '918669210030',
  business_address TEXT,
  currency_symbol TEXT DEFAULT '₹',
  currency_code TEXT DEFAULT 'INR',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#3b82f6',
  footer_text TEXT DEFAULT '© 2026 SnapGem Store. All rights reserved.',
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  google_maps_url TEXT,
  gst_number TEXT,
  store_timing TEXT DEFAULT 'Mon-Sat: 10:00 AM - 8:00 PM',
  enable_cod BOOLEAN DEFAULT true,
  base_shipping_charge NUMERIC DEFAULT 0,
  free_shipping_threshold NUMERIC DEFAULT 1000,
  delivery_time_text TEXT,
  announcement_bar_active BOOLEAN DEFAULT false,
  announcement_text TEXT,
  announcement_link TEXT,
  maintenance_mode BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  google_analytics_id TEXT,
  google_site_verification TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS base_shipping_charge NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC DEFAULT 1000,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS store_timing TEXT DEFAULT 'Mon-Sat: 10:00 AM - 8:00 PM',
ADD COLUMN IF NOT EXISTS enable_cod BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin Manage store_settings" ON public.store_settings;

CREATE POLICY "Public Read store_settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admin Manage store_settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
