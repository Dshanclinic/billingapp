/*
  # Create hospital_services and diagnostic_services tables

  1. New Tables
    - `hospital_services`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `default_price` (numeric)
      - `extra_copies_json` (jsonb, array of {copy_name: string})
      - `created_at` (timestamptz)
    - `diagnostic_services`
      - Same structure as hospital_services
  2. Security
    - Enable RLS on both
    - Authenticated users can read
    - Admin can insert, update, delete
*/

CREATE TABLE IF NOT EXISTS hospital_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  default_price numeric NOT NULL DEFAULT 0,
  extra_copies_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hospital_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read hospital_services"
  ON hospital_services FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can insert hospital_services"
  ON hospital_services FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Admin can update hospital_services"
  ON hospital_services FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Admin can delete hospital_services"
  ON hospital_services FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TABLE IF NOT EXISTS diagnostic_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  default_price numeric NOT NULL DEFAULT 0,
  extra_copies_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnostic_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read diagnostic_services"
  ON diagnostic_services FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can insert diagnostic_services"
  ON diagnostic_services FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Admin can update diagnostic_services"
  ON diagnostic_services FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Admin can delete diagnostic_services"
  ON diagnostic_services FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));