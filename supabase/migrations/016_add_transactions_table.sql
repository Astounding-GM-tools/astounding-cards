-- Migration: Add transactions table for payment tracking
-- Created: 2025-12-11
-- Purpose: Track token purchases via Lemon Squeezy

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
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

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- For debugging and audit trail
  webhook_payload JSONB,

  -- Ensure valid status values
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'refunded', 'failed'))
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_lemon_squeezy_order_id ON public.transactions(lemon_squeezy_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Add comment on table
COMMENT ON TABLE public.transactions IS 'Tracks token purchases via Lemon Squeezy payment processor';

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
