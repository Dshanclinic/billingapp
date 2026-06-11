/*
  # Create diagnostic_results table and update profiles for room_user role

  1. New Tables
    - `diagnostic_results` - stores diagnostic test results entered by room users
      - `id` (uuid, PK)
      - `bill_id` (uuid, FK to diagnostic_bills)
      - `service_name` (text) - which test/service this result is for
      - `room_type` (text) - X-Ray / Ultrasonography / Pathology / Other
      - `result_json` (jsonb) - stores the result fields specific to room type
      - `status` (text) - pending/completed
      - `delivered_by` (uuid, FK to profiles)
      - `delivered_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Changes to profiles
    - Update role check to allow 'room_user' role
    - Add room_type column for room users

  3. Security
    - RLS on diagnostic_results
    - Authenticated can read
    - Room users and authenticated can insert/update
*/

-- Create diagnostic_results table
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES diagnostic_bills(id),
  service_name text NOT NULL,
  room_type text NOT NULL CHECK (room_type IN ('X-Ray', 'Ultrasonography', 'Pathology', 'Other')),
  result_json jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  delivered_by uuid REFERENCES profiles(id),
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read diagnostic_results"
  ON diagnostic_results FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert diagnostic_results"
  ON diagnostic_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update diagnostic_results"
  ON diagnostic_results FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add room_type column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'room_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN room_type text;
  END IF;
END $$;

-- Update role check constraint to include room_user
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'receptionist', 'room_user'));