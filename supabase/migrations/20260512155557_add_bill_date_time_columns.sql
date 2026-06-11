/*
  # Add bill_date, bill_time columns and rename total to grand_total

  1. Modified Tables
    - `hospital_bills`: Add bill_date, bill_time columns, rename total to grand_total
    - `diagnostic_bills`: Same changes
  2. Notes
    - bill_date stores the date string
    - bill_time stores the time string
    - grand_total replaces total for clarity
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_bills' AND column_name = 'bill_date'
  ) THEN
    ALTER TABLE hospital_bills ADD COLUMN bill_date text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_bills' AND column_name = 'bill_time'
  ) THEN
    ALTER TABLE hospital_bills ADD COLUMN bill_time text NOT NULL DEFAULT '';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_bills' AND column_name = 'total'
  ) THEN
    ALTER TABLE hospital_bills RENAME COLUMN total TO grand_total;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_bills' AND column_name = 'bill_date'
  ) THEN
    ALTER TABLE diagnostic_bills ADD COLUMN bill_date text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_bills' AND column_name = 'bill_time'
  ) THEN
    ALTER TABLE diagnostic_bills ADD COLUMN bill_time text NOT NULL DEFAULT '';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_bills' AND column_name = 'total'
  ) THEN
    ALTER TABLE diagnostic_bills RENAME COLUMN total TO grand_total;
  END IF;
END $$;