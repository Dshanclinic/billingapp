/*
  # Fix profiles RLS circular reference

  1. Changes
    - Create a security definer function `is_admin()` that checks the user role 
      without going through RLS (avoids infinite recursion)
    - Drop and recreate admin policies on profiles table using this function
    - Also update policies on doctors, beds, hospital_services, diagnostic_services 
      to use the new function for consistency
  2. Notes
    - The `is_admin()` function is SECURITY DEFINER which means it runs with 
      the privileges of the function owner, bypassing RLS
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop existing admin policies on profiles
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;

-- Recreate using the security definer function
CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Fix doctors table policies
DROP POLICY IF EXISTS "Admin can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Admin can update doctors" ON doctors;
DROP POLICY IF EXISTS "Admin can delete doctors" ON doctors;

CREATE POLICY "Admin can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Fix beds table policies
DROP POLICY IF EXISTS "Admin can insert beds" ON beds;
DROP POLICY IF EXISTS "Admin can update beds" ON beds;
DROP POLICY IF EXISTS "Admin can delete beds" ON beds;

CREATE POLICY "Admin can insert beds"
  ON beds FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update beds"
  ON beds FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete beds"
  ON beds FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Fix hospital_services policies
DROP POLICY IF EXISTS "Admin can insert hospital_services" ON hospital_services;
DROP POLICY IF EXISTS "Admin can update hospital_services" ON hospital_services;
DROP POLICY IF EXISTS "Admin can delete hospital_services" ON hospital_services;

CREATE POLICY "Admin can insert hospital_services"
  ON hospital_services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update hospital_services"
  ON hospital_services FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete hospital_services"
  ON hospital_services FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Fix diagnostic_services policies
DROP POLICY IF EXISTS "Admin can insert diagnostic_services" ON diagnostic_services;
DROP POLICY IF EXISTS "Admin can update diagnostic_services" ON diagnostic_services;
DROP POLICY IF EXISTS "Admin can delete diagnostic_services" ON diagnostic_services;

CREATE POLICY "Admin can insert diagnostic_services"
  ON diagnostic_services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update diagnostic_services"
  ON diagnostic_services FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete diagnostic_services"
  ON diagnostic_services FOR DELETE
  TO authenticated
  USING (public.is_admin());