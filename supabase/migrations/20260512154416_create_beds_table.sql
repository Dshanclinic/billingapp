/*
  # Create beds table

  1. New Tables
    - `beds`
      - `id` (uuid, primary key)
      - `bed_number` (text)
      - `type` (text: General/Cabin/ICU)
      - `ward` (text)
      - `status` (text: Available/Occupied)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS
    - Authenticated users can read beds
    - Admin can manage beds
*/

CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_number text NOT NULL,
  type text NOT NULL DEFAULT 'General' CHECK (type IN ('General', 'Cabin', 'ICU')),
  ward text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read beds"
  ON beds FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can insert beds"
  ON beds FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Admin can update beds"
  ON beds FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Admin can delete beds"
  ON beds FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));