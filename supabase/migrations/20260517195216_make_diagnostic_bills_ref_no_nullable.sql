/*
  # Make ref_no nullable in diagnostic_bills

  1. Changes
    - Drop NOT NULL constraint on ref_no in diagnostic_bills table
    - Allows diagnostic bills to be created without a reference number
*/

ALTER TABLE diagnostic_bills ALTER COLUMN ref_no DROP NOT NULL;