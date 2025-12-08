-- Migration: Prevent users from liking their own decks
-- Purpose: Add validation to block self-likes
-- Date: 2025-12-08

-- Update the process_deck_like function to prevent self-likes
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

COMMENT ON FUNCTION process_deck_like IS 'Processes a like: deducts 10 tokens from liker, distributes to creators (50/50 if remix). Prevents self-likes.';
