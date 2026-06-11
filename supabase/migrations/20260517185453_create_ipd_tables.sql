/*
  # Create IPD (In-Patient Department) tables

  1. New Tables
    - `ipd_admissions` - tracks admitted patients
      - `id` (uuid, PK)
      - `patient_id` (uuid, FK to patients)
      - `patient_code` (text, unique) - format IPD-YYYY-NNNN
      - `doctor_id` (uuid, FK to doctors)
      - `cabin_id` (uuid, FK to beds)
      - `contract_amount` (numeric)
      - `admission_date` (timestamptz)
      - `release_date` (timestamptz, nullable)
      - `status` (text) - admitted/released
      - `created_by` (uuid, FK to profiles)
      - `created_at` (timestamptz)

    - `ipd_advances` - advance payments during stay
      - `id` (uuid, PK)
      - `admission_id` (uuid, FK to ipd_admissions)
      - `amount` (numeric)
      - `payment_method` (text)
      - `note` (text)
      - `created_by` (uuid, FK to profiles)
      - `created_at` (timestamptz)

    - `ipd_services` - services added during stay
      - `id` (uuid, PK)
      - `admission_id` (uuid, FK to ipd_admissions)
      - `service_name` (text)
      - `quantity` (integer)
      - `price` (numeric)
      - `added_by` (uuid, FK to profiles)
      - `added_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Authenticated users can read and insert
    - Update policies for admissions (status changes)
*/

-- ipd_admissions
CREATE TABLE IF NOT EXISTS ipd_admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  patient_code text UNIQUE NOT NULL,
  doctor_id uuid REFERENCES doctors(id),
  cabin_id uuid REFERENCES beds(id),
  contract_amount numeric NOT NULL DEFAULT 0,
  admission_date timestamptz NOT NULL DEFAULT now(),
  release_date timestamptz,
  status text NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted', 'released')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ipd_admissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ipd_admissions"
  ON ipd_admissions FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert ipd_admissions"
  ON ipd_admissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update ipd_admissions"
  ON ipd_admissions FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ipd_advances
CREATE TABLE IF NOT EXISTS ipd_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL REFERENCES ipd_admissions(id),
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash',
  note text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ipd_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ipd_advances"
  ON ipd_advances FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert ipd_advances"
  ON ipd_advances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ipd_services
CREATE TABLE IF NOT EXISTS ipd_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL REFERENCES ipd_admissions(id),
  service_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  added_by uuid REFERENCES profiles(id),
  added_at timestamptz DEFAULT now()
);

ALTER TABLE ipd_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ipd_services"
  ON ipd_services FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert ipd_services"
  ON ipd_services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);