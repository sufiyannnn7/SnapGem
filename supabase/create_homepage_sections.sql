-- =====================================================================
-- CREATE HOMEPAGE SECTIONS TABLE & RLS POLICIES
-- Execute this SQL script in your Supabase SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Read homepage_sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admin Manage homepage_sections" ON public.homepage_sections;

-- Public Read access for storefront rendering
CREATE POLICY "Public Read homepage_sections"
ON public.homepage_sections FOR SELECT
USING (true);

-- Admin full management policy
CREATE POLICY "Admin Manage homepage_sections"
ON public.homepage_sections FOR ALL
USING (true)
WITH CHECK (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
