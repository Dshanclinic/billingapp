/*
  # Create hospital_bills and diagnostic_bills tables

  1. New Tables
    - `hospital_bills`
      - `id` (uuid, primary key)
      - `bill_no` (text, unique)
      - `patient_id` (uuid, references patients)
      - `doctor_id` (uuid, nullable, references doctors)
      - `bed_id` (uuid, nullable, references beds)
      - `ref_no` (text)
      - `bill_date` (text)
      - `bill_time` (text)
      - `services_json` (jsonb)
      - `subtotal` (numeric)
      - `discount` (numeric)
      - `grand_total` (numeric)
      - `payment_method` (text)
      - `due_amount` (numeric)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
    - `diagnostic_bills`
      - `id` (uuid, primary key)
      - `bill_no` (text, unique)
      - `patient_id` (uuid, references patients)
      - `referred_by` (text)
      - `ref_no` (text)
      - `bill_date` (text)
      - `bill_time` (text)
      - `services_json` (jsonb)
      - `subtotal` (numeric)
      - `discount` (numeric)
      - `grand_total` (numeric)
      - `payment_method` (text)
      - `due_amount` (numeric)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on both
    - Authenticated users can read and insert bills
*/

CREATE TABLE IF NOT EXISTS hospital_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no text NOT NULL UNIQUE,
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid REFERENCES doctors(id),
  bed_id uuid REFERENCES beds(id),
  ref_no text NOT NULL DEFAULT '',
  bill_date text NOT NULL DEFAULT '',
  bill_time text NOT NULL DEFAULT '',
  services_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash',
  due_amount numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hospital_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read hospital_bills"
  ON hospital_bills FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert hospital_bills"
  ON hospital_bills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS diagnostic_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no text NOT NULL UNIQUE,
  patient_id uuid NOT NULL REFERENCES patients(id),
  referred_by text NOT NULL DEFAULT '',
  ref_no text NOT NULL DEFAULT '',
  bill_date text NOT NULL DEFAULT '',
  bill_time text NOT NULL DEFAULT '',
  services_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash',
  due_amount numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnostic_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read diagnostic_bills"
  ON diagnostic_bills FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert diagnostic_bills"
  ON diagnostic_bills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);