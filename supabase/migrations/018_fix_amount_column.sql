-- Migration: Fix amount column name
-- Created: 2025-12-13
-- Purpose: Rename amount_nok to amount_usd (or add if missing)

-- Check if we have amount_nok and rename it to amount_usd
DO $$
BEGIN
  -- If amount_nok exists, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'amount_nok'
  ) THEN
    ALTER TABLE public.transactions RENAME COLUMN amount_nok TO amount_usd;
  END IF;

  -- If amount_usd still doesn't exist, create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'amount_usd'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN amount_usd DECIMAL(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.transactions.amount_usd IS 'Transaction amount in USD';
