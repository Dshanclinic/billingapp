/*
  # Create cabin_types table and update beds

  1. New Tables
    - `cabin_types` - stores cabin type definitions with daily charges
      - `id` (uuid, primary key)
      - `type_name` (text, unique) - e.g. Ward, Single Cabin, Double Cabin, VIP Cabin
      - `daily_charge` (numeric) - daily rate for the cabin type
      - `created_at` (timestamptz)
  2. Changes to beds table
    - Add `cabin_type_id` column (FK to cabin_types.id)
    - Remove old `cabin_type` text column and its check constraint
  3. Security
    - RLS enabled on cabin_types
    - Authenticated users can read
    - Admin can insert/update/delete
*/

-- Create cabin_types table
CREATE TABLE IF NOT EXISTS cabin_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name text UNIQUE NOT NULL,
  daily_charge numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cabin_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read cabin_types"
  ON cabin_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert cabin_types"
  ON cabin_types FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can update cabin_types"
  ON cabin_types FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can delete cabin_types"
  ON cabin_types FOR DELETE
  TO authenticated
  USING (private.is_admin());

-- Seed default cabin types
INSERT INTO cabin_types (type_name, daily_charge) VALUES
  ('Ward', 500),
  ('Single Cabin', 1500),
  ('Double Cabin', 2500),
  ('VIP Cabin', 5000)
ON CONFLICT (type_name) DO NOTHING;

-- Drop old check constraint on beds
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'beds' AND constraint_name = 'beds_cabin_type_check'
  ) THEN
    ALTER TABLE beds DROP CONSTRAINT beds_cabin_type_check;
  END IF;
END $$;

-- Drop old cabin_type text column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beds' AND column_name = 'cabin_type'
  ) THEN
    ALTER TABLE beds DROP COLUMN cabin_type;
  END IF;
END $$;

-- Add cabin_type_id FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beds' AND column_name = 'cabin_type_id'
  ) THEN
    ALTER TABLE beds ADD COLUMN cabin_type_id uuid REFERENCES cabin_types(id);
  END IF;
END $$;