-- Migration: Add test_mode flag to transactions
-- Created: 2025-12-13
-- Purpose: Track whether a transaction was in test mode or production mode

-- First, add webhook_payload if it doesn't exist (in case migration 016 didn't have it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'webhook_payload'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN webhook_payload JSONB;
  END IF;
END $$;

-- Add test_mode column to transactions table
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS test_mode BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering by test mode
CREATE INDEX IF NOT EXISTS idx_transactions_test_mode ON public.transactions(test_mode);

-- Add comment
COMMENT ON COLUMN public.transactions.test_mode IS 'Whether this transaction was processed in test mode (Lemon Squeezy test mode)';

-- Update existing records to set test_mode based on webhook payload if available
-- This is a one-time update for any existing records
UPDATE public.transactions
SET test_mode = COALESCE((webhook_payload->'meta'->>'test_mode')::boolean, false)
WHERE webhook_payload IS NOT NULL;
