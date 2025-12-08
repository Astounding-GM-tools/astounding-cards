-- Migration: Add deck likes feature with token-based tipping system
-- Purpose: Allow users to like decks, costing 10 tokens split between creators
-- Date: 2025-12-08

-- ============================================================================
-- STEP 1: Create user_deck_likes table (prevents duplicate likes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_deck_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  deck_id UUID REFERENCES published_decks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each user can only like a deck once
  UNIQUE(user_id, deck_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_deck_likes_user_id ON user_deck_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_deck_likes_deck_id ON user_deck_likes(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_deck_likes_created_at ON user_deck_likes(created_at DESC);

-- ============================================================================
-- STEP 2: Enable Row Level Security
-- ============================================================================

ALTER TABLE user_deck_likes ENABLE ROW LEVEL SECURITY;

-- Users can read their own likes
CREATE POLICY "Users can read own likes" ON user_deck_likes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own likes
CREATE POLICY "Users can insert own likes" ON user_deck_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes" ON user_deck_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 3: Function to check if user has liked a deck
-- ============================================================================

CREATE OR REPLACE FUNCTION has_user_liked_deck(p_user_id UUID, p_deck_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_deck_likes
    WHERE user_id = p_user_id AND deck_id = p_deck_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- STEP 4: Function to process a like with token transfer
-- ============================================================================

CREATE OR REPLACE FUNCTION process_deck_like(
  p_user_id UUID,
  p_deck_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_deck_creator_id UUID;
  v_remix_of UUID;
  v_parent_creator_id UUID;
  v_user_credits INTEGER;
  v_tokens_to_creator INTEGER := 10;
  v_tokens_to_parent INTEGER := 0;
  v_already_liked BOOLEAN;
BEGIN
  -- Check if user already liked this deck
  v_already_liked := has_user_liked_deck(p_user_id, p_deck_id);

  IF v_already_liked THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have already liked this deck'
    );
  END IF;

  -- Get user's current credits
  SELECT credits INTO v_user_credits
  FROM users
  WHERE id = p_user_id;

  -- Check if user has enough credits
  IF v_user_credits < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient tokens. You need 10 tokens to like a deck.'
    );
  END IF;

  -- Get deck creator and remix info
  SELECT user_id, remix_of INTO v_deck_creator_id, v_remix_of
  FROM published_decks
  WHERE id = p_deck_id;

  IF v_deck_creator_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Deck not found'
    );
  END IF;

  -- Prevent users from liking their own decks
  IF v_deck_creator_id = p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You cannot like your own deck'
    );
  END IF;

  -- Check if it's a remix - if so, split tokens 50/50
  IF v_remix_of IS NOT NULL THEN
    -- Get parent deck creator
    SELECT user_id INTO v_parent_creator_id
    FROM published_decks
    WHERE id = v_remix_of;

    -- Split tokens: 5 to remix creator, 5 to original creator
    v_tokens_to_creator := 5;
    v_tokens_to_parent := 5;
  END IF;

  -- Deduct 10 tokens from liker
  UPDATE users
  SET credits = credits - 10
  WHERE id = p_user_id;

  -- Record transaction for liker
  INSERT INTO transactions (user_id, type, credits_delta, description)
  VALUES (p_user_id, 'usage', -10, 'Liked deck: ' || p_deck_id);

  -- Give tokens to deck creator
  UPDATE users
  SET credits = credits + v_tokens_to_creator
  WHERE id = v_deck_creator_id;

  -- Record transaction for deck creator
  INSERT INTO transactions (user_id, type, credits_delta, description)
  VALUES (v_deck_creator_id, 'purchase', v_tokens_to_creator, 'Received like on deck: ' || p_deck_id);

  -- If remix, give tokens to parent creator too
  IF v_tokens_to_parent > 0 AND v_parent_creator_id IS NOT NULL THEN
    UPDATE users
    SET credits = credits + v_tokens_to_parent
    WHERE id = v_parent_creator_id;

    -- Record transaction for parent creator
    INSERT INTO transactions (user_id, type, credits_delta, description)
    VALUES (v_parent_creator_id, 'purchase', v_tokens_to_parent, 'Received like on remix of your deck: ' || v_remix_of);
  END IF;

  -- Record the like
  INSERT INTO user_deck_likes (user_id, deck_id)
  VALUES (p_user_id, p_deck_id);

  -- Increment deck's like count
  UPDATE published_decks
  SET like_count = like_count + 1
  WHERE id = p_deck_id;

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'tokens_to_creator', v_tokens_to_creator,
    'tokens_to_parent', v_tokens_to_parent,
    'is_remix', v_remix_of IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- STEP 5: Function to unlike a deck (no refund, just remove like)
-- ============================================================================

CREATE OR REPLACE FUNCTION process_deck_unlike(
  p_user_id UUID,
  p_deck_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Remove the like
  DELETE FROM user_deck_likes
  WHERE user_id = p_user_id AND deck_id = p_deck_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have not liked this deck'
    );
  END IF;

  -- Decrement deck's like count
  UPDATE published_decks
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = p_deck_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Like removed (tokens are not refunded)'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE user_deck_likes IS 'Tracks which users have liked which decks (prevents duplicates)';
COMMENT ON FUNCTION process_deck_like IS 'Processes a like: deducts 10 tokens from liker, distributes to creators (50/50 if remix)';
COMMENT ON FUNCTION process_deck_unlike IS 'Removes a like without refunding tokens';
COMMENT ON FUNCTION has_user_liked_deck IS 'Checks if a user has already liked a specific deck';
