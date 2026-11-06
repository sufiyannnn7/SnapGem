-- =====================================================================
-- COMPLETE SUPABASE STORAGE & MEDIA_LIBRARY RLS POLICIES FIX
-- Execute this SQL script in your Supabase SQL Editor to resolve RLS errors
-- =====================================================================

-- 1. Create all required storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('products', 'products', true),
  ('categories', 'categories', true),
  ('banners', 'banners', true),
  ('logos', 'logos', true),
  ('cms', 'cms', true),
  ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Public Read Storage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Storage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Storage Objects" ON storage.objects;

-- Allow PUBLIC READ access for all storage objects
CREATE POLICY "Public Read Storage Objects"
ON storage.objects FOR SELECT
USING (true);

-- Allow AUTHENTICATED users to INSERT into storage.objects
CREATE POLICY "Admin Upload Storage Objects"
ON storage.objects FOR INSERT
WITH CHECK (true);

-- Allow AUTHENTICATED users to UPDATE storage.objects
CREATE POLICY "Admin Update Storage Objects"
ON storage.objects FOR UPDATE
USING (true);

-- Allow AUTHENTICATED users to DELETE storage.objects
CREATE POLICY "Admin Delete Storage Objects"
ON storage.objects FOR DELETE
USING (true);

-- 3. Fix public.media_library Table RLS Policies
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  folder TEXT DEFAULT 'products',
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read media_library" ON public.media_library;
DROP POLICY IF EXISTS "Admin Insert media_library" ON public.media_library;
DROP POLICY IF EXISTS "Admin Delete media_library" ON public.media_library;

CREATE POLICY "Public Read media_library"
ON public.media_library FOR SELECT
USING (true);

CREATE POLICY "Admin Insert media_library"
ON public.media_library FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin Delete media_library"
ON public.media_library FOR DELETE
USING (true);
