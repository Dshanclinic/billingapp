/*
  # Secure is_admin() function

  1. Changes
    - Set search_path to empty string to prevent search path manipulation
    - Revoke EXECUTE from public, anon, and authenticated roles
      (The function is still callable within RLS policies since those 
      execute in the context of the table owner, not the calling user)
  2. Security
    - Fixes mutable search_path vulnerability
    - Prevents direct invocation via /rest/v1/rpc/is_admin by anon or authenticated users
*/

CREATE OR REPLACE FUNCTION public.is_admin()
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

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;