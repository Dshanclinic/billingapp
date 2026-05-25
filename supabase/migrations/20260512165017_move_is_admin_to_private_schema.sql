/*
  # Move is_admin() to private schema

  1. Changes
    - Create a `private` schema not exposed via PostgREST
    - Drop all existing policies that reference public.is_admin()
    - Drop public.is_admin() function
    - Create private.is_admin() function (not accessible via REST API)
    - Recreate all policies using private.is_admin()
  2. Security
    - Function is no longer exposed via the REST API endpoint /rest/v1/rpc/is_admin
    - Authenticated users cannot invoke it directly
    - RLS policies still function correctly
*/

-- Create private schema (not exposed by PostgREST)
CREATE SCHEMA IF NOT EXISTS private;

-- Drop all policies that depend on public.is_admin()
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Admin can update doctors" ON doctors;
DROP POLICY IF EXISTS "Admin can delete doctors" ON doctors;
DROP POLICY IF EXISTS "Admin can insert beds" ON beds;
DROP POLICY IF EXISTS "Admin can update beds" ON beds;
DROP POLICY IF EXISTS "Admin can delete beds" ON beds;
DROP POLICY IF EXISTS "Admin can insert hospital_services" ON hospital_services;
DROP POLICY IF EXISTS "Admin can update hospital_services" ON hospital_services;
DROP POLICY IF EXISTS "Admin can delete hospital_services" ON hospital_services;
DROP POLICY IF EXISTS "Admin can insert diagnostic_services" ON diagnostic_services;
DROP POLICY IF EXISTS "Admin can update diagnostic_services" ON diagnostic_services;
DROP POLICY IF EXISTS "Admin can delete diagnostic_services" ON diagnostic_services;

-- Now drop the old public function
DROP FUNCTION IF EXISTS public.is_admin();

-- Create the function in the private schema
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute to authenticated (needed for RLS policy evaluation)
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Recreate profiles policies
CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (private.is_admin());

CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (private.is_admin());

-- Recreate doctors policies
CREATE POLICY "Admin can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can update doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can delete doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING (private.is_admin());

-- Recreate beds policies
CREATE POLICY "Admin can insert beds"
  ON beds FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can update beds"
  ON beds FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can delete beds"
  ON beds FOR DELETE
  TO authenticated
  USING (private.is_admin());

-- Recreate hospital_services policies
CREATE POLICY "Admin can insert hospital_services"
  ON hospital_services FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can update hospital_services"
  ON hospital_services FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can delete hospital_services"
  ON hospital_services FOR DELETE
  TO authenticated
  USING (private.is_admin());

-- Recreate diagnostic_services policies
CREATE POLICY "Admin can insert diagnostic_services"
  ON diagnostic_services FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can update diagnostic_services"
  ON diagnostic_services FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can delete diagnostic_services"
  ON diagnostic_services FOR DELETE
  TO authenticated
  USING (private.is_admin());