/*
  # Make ref_no nullable in hospital_bills

  1. Changes
    - Drop NOT NULL constraint on ref_no in hospital_bills
    - Allows bills to be created without a reference number
*/

ALTER TABLE hospital_bills ALTER COLUMN ref_no DROP NOT NULL;