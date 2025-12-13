-- Migration: Recreate transactions table with correct schema
-- Created: 2025-12-13
-- Purpose: Fix table structure - old schema was incompatible with Lemon Squeezy integration

-- Rename the old transactions table (keep it for reference/backup)
ALTER TABLE IF EXISTS public.transactions RENAME TO transactions_old_backup;

-- Drop policies on old table
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions_old_backup;
DROP POLICY IF EXISTS "Service role can manage transactions" ON public.transactions_old_backup;

-- Drop old indexes (they don't get renamed with the table)
DROP INDEX IF EXISTS public.idx_transactions_user_id;
DROP INDEX IF EXISTS public.idx_transactions_lemon_squeezy_order_id;
DROP INDEX IF EXISTS public.idx_transactions_status;
DROP INDEX IF EXISTS public.idx_transactions_test_mode;
DROP INDEX IF EXISTS public.idx_transactions_created_at;

-- Create new transactions table with correct Lemon Squeezy schema
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Lemon Squeezy data
  lemon_squeezy_order_id TEXT UNIQUE NOT NULL,
  lemon_squeezy_checkout_id TEXT,
  variant_id TEXT NOT NULL,
  variant_name TEXT NOT NULL,

  -- Transaction details
  amount_usd DECIMAL(10, 2) NOT NULL,
  tokens_purchased INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  test_mode BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- For debugging and audit trail
  webhook_payload JSONB,

  -- Ensure valid status values
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'refunded', 'failed'))
);

-- Add indexes for common queries
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_lemon_squeezy_order_id ON public.transactions(lemon_squeezy_order_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_test_mode ON public.transactions(test_mode);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Add comments
COMMENT ON TABLE public.transactions IS 'Tracks token purchases via Lemon Squeezy payment processor';
COMMENT ON COLUMN public.transactions.test_mode IS 'Whether this transaction was processed in test mode (Lemon Squeezy test mode)';
COMMENT ON COLUMN public.transactions.amount_usd IS 'Transaction amount in USD';

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all transactions (for API endpoints)
CREATE POLICY "Service role can manage transactions"
  ON public.transactions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transactions_updated_at();

-- Grant permissions
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

-- Note: The old transactions table is now renamed to transactions_old_backup
-- You can delete it later if you don't need it:
-- DROP TABLE public.transactions_old_backup;
