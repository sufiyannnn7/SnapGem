-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR PUBLIC.CATEGORIES
-- Fixes "new row violates row-level security policy for table categories"
-- =============================================================================

-- 1. Ensure RLS is enabled on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Public users can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can select all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- 3. Policy: Public users (anon and authenticated) can view active categories
CREATE POLICY "Public users can view active categories"
ON public.categories
FOR SELECT
TO public
USING (is_active = true AND deleted_at IS NULL);

-- 4. Policy: Admin users (present in admin_users table) can SELECT all categories
CREATE POLICY "Admins can select all categories"
ON public.categories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);

-- 5. Policy: Admin users can INSERT categories
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);

-- 6. Policy: Admin users can UPDATE categories
CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);

-- 7. Policy: Admin users can DELETE categories
CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);
