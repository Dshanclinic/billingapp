/*
  # Add final_payment_method to ipd_admissions

  1. Changes
    - Add `final_payment_method` column (text, nullable) to ipd_admissions
    - Stores the payment method used for the final/remaining payment at release
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ipd_admissions' AND column_name = 'final_payment_method'
  ) THEN
    ALTER TABLE ipd_admissions ADD COLUMN final_payment_method text;
  END IF;
END $$;