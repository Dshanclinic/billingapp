/*
  # Add foreign key on created_by for bills tables

  1. Changes
    - Add FK from hospital_bills.created_by to profiles.id
    - Add FK from diagnostic_bills.created_by to profiles.id
  2. Notes
    - Enables PostgREST joins: profiles:created_by(full_name)
    - Required to show receptionist name in bill history
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'hospital_bills_created_by_fkey' AND table_name = 'hospital_bills'
  ) THEN
    ALTER TABLE hospital_bills
      ADD CONSTRAINT hospital_bills_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'diagnostic_bills_created_by_fkey' AND table_name = 'diagnostic_bills'
  ) THEN
    ALTER TABLE diagnostic_bills
      ADD CONSTRAINT diagnostic_bills_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;