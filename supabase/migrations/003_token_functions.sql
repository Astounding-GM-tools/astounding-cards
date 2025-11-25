-- Token Management Functions
-- Atomic token deduction with balance checking

-- Function to deduct tokens from user's balance
-- Returns TRUE if successful, FALSE if insufficient balance
CREATE OR REPLACE FUNCTION deduct_tokens(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance and lock row for update (prevents race conditions)
  SELECT credits INTO current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists and has enough tokens
  IF current_balance IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct tokens
  UPDATE users
  SET credits = credits - p_amount
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON FUNCTION deduct_tokens IS 'Atomically deducts tokens from user balance with row locking to prevent race conditions. Returns TRUE on success, FALSE if insufficient balance.';
