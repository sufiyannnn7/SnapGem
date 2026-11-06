-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR PUBLIC.ADMIN_USERS
-- Fixes HTTP 403 Forbidden on /rest/v1/admin_users
-- =============================================================================

-- 1. Ensure RLS is enabled on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting policies if any
DROP POLICY IF EXISTS "Allow users to read own admin row" ON public.admin_users;
DROP POLICY IF EXISTS "Allow users to update own admin row" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON public.admin_users;

-- 3. Policy: Allow authenticated users to SELECT only their own row
CREATE POLICY "Allow users to read own admin row"
ON public.admin_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 4. Policy: Allow authenticated users to UPDATE only their own row
CREATE POLICY "Allow users to update own admin row"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
