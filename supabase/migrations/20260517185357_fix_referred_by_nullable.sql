/*
  # Fix referred_by nullable constraint

  1. Changes
    - Make referred_by column nullable in diagnostic_bills table
    - Previously it was NOT NULL causing errors when no referrer specified
*/

ALTER TABLE diagnostic_bills ALTER COLUMN referred_by DROP NOT NULL;