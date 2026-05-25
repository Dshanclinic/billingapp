/*
  # Update beds table to cabin structure

  1. Changes
    - Rename `bed_number` to `cabin_number`
    - Replace `type` column (General/Cabin/ICU) with `cabin_type` (VIP Cabin (AC) / Non-VIP Cabin)
    - Remove `ward` column
    - Drop old CHECK constraint, add new one for cabin_type
  2. Notes
    - Existing data will be cleared since the schema changes fundamentally
    - Status column remains unchanged (Available/Occupied)
*/

-- Remove old check constraint on type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'beds' AND constraint_type = 'CHECK' AND constraint_name = 'beds_type_check'
  ) THEN
    ALTER TABLE beds DROP CONSTRAINT beds_type_check;
  END IF;
END $$;

-- Rename bed_number to cabin_number
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'beds' AND column_name = 'bed_number'
  ) THEN
    ALTER TABLE beds RENAME COLUMN bed_number TO cabin_number;
  END IF;
END $$;

-- Replace type column with cabin_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'beds' AND column_name = 'type'
  ) THEN
    ALTER TABLE beds DROP COLUMN type;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'beds' AND column_name = 'cabin_type'
  ) THEN
    ALTER TABLE beds ADD COLUMN cabin_type text NOT NULL DEFAULT 'Non-VIP Cabin';
  END IF;
END $$;

-- Remove ward column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'beds' AND column_name = 'ward'
  ) THEN
    ALTER TABLE beds DROP COLUMN ward;
  END IF;
END $$;

-- Add check constraint for cabin_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'beds' AND constraint_name = 'beds_cabin_type_check'
  ) THEN
    ALTER TABLE beds ADD CONSTRAINT beds_cabin_type_check 
      CHECK (cabin_type IN ('VIP Cabin (AC)', 'Non-VIP Cabin'));
  END IF;
END $$;