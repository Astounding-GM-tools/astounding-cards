-- Migration: Fix Function Search Path Security
-- Purpose: Add SECURITY DEFINER and SET search_path to all functions
-- Date: 2025-11-25
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ============================================================================
-- Fix functions from schema.sql
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to reset daily free decks counter
CREATE OR REPLACE FUNCTION reset_daily_free_decks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE users
  SET
    daily_free_decks_used = 0,
    daily_free_decks_reset_at = NOW()
  WHERE daily_free_decks_reset_at < NOW() - INTERVAL '1 day';
END;
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(deck_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE published_decks
  SET view_count = view_count + 1
  WHERE id = deck_id;
END;
$$;

-- ============================================================================
-- Fix functions from community_images migration
-- ============================================================================

-- Function to find existing remix
CREATE OR REPLACE FUNCTION find_image_remix(
  p_source_image_id UUID,
  p_style TEXT
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    community_images.id,
    community_images.url,
    community_images.created_at
  FROM community_images
  WHERE
    community_images.source_image_id = p_source_image_id
    AND community_images.style = p_style
  LIMIT 1;
END;
$$;

-- Function to search images by semantic similarity
CREATE OR REPLACE FUNCTION search_similar_images(
  p_query_embedding vector(768),
  p_preferred_style TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  original_id UUID,
  original_url TEXT,
  original_style TEXT,
  variants JSONB,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH originals AS (
    -- Find similar original images (those with embeddings)
    SELECT
      ci.id,
      ci.url,
      ci.style,
      ci.created_at,
      1 - (ci.embedding <=> p_query_embedding) AS similarity_score
    FROM community_images ci
    WHERE ci.embedding IS NOT NULL
    ORDER BY ci.embedding <=> p_query_embedding
    LIMIT p_limit
  ),
  with_variants AS (
    -- Get all style variants for each original
    SELECT
      o.id AS original_id,
      o.url AS original_url,
      o.style AS original_style,
      o.similarity_score,
      o.created_at,
      jsonb_agg(
        jsonb_build_object(
          'id', v.id,
          'url', v.url,
          'style', v.style,
          'created_at', v.created_at
        ) ORDER BY
          CASE WHEN v.style = p_preferred_style THEN 0 ELSE 1 END,
          v.created_at DESC
      ) FILTER (WHERE v.id IS NOT NULL) AS variants
    FROM originals o
    LEFT JOIN community_images v ON v.source_image_id = o.id
    GROUP BY o.id, o.url, o.style, o.similarity_score, o.created_at
  )
  SELECT
    wv.original_id,
    wv.original_url,
    wv.original_style,
    COALESCE(wv.variants, '[]'::jsonb) AS variants,
    wv.similarity_score,
    wv.created_at
  FROM with_variants wv
  ORDER BY wv.similarity_score DESC;
END;
$$;

-- ============================================================================
-- Fix functions from token_functions migration
-- ============================================================================

-- Function to deduct tokens from user's balance
CREATE OR REPLACE FUNCTION deduct_tokens(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- ============================================================================
-- Fix functions from user_decks migration
-- ============================================================================

-- Function to increment import count on published decks
CREATE OR REPLACE FUNCTION increment_import_count(deck_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE published_decks
  SET import_count = import_count + 1
  WHERE id = deck_id;
END;
$$;

-- Function to increment like count on published decks
CREATE OR REPLACE FUNCTION increment_like_count(deck_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE published_decks
  SET like_count = like_count + 1
  WHERE id = deck_id;
END;
$$;

-- Function to decrement like count on published decks
CREATE OR REPLACE FUNCTION decrement_like_count(deck_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE published_decks
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = deck_id;
END;
$$;

-- ============================================================================
-- Fix functions from remix_lineage migration
-- ============================================================================

-- Function to increment remix count
CREATE OR REPLACE FUNCTION increment_remix_count(deck_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE published_decks
  SET remix_count = remix_count + 1
  WHERE id = deck_id;
END;
$$;

-- Function to decrement remix count
CREATE OR REPLACE FUNCTION decrement_remix_count(deck_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE published_decks
  SET remix_count = GREATEST(0, remix_count - 1)
  WHERE id = deck_id;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify all functions now have search_path set:
-- SELECT
--   p.proname as function_name,
--   pg_get_function_identity_arguments(p.oid) as arguments,
--   CASE
--     WHEN p.proconfig IS NULL THEN 'NO SEARCH PATH SET ❌'
--     WHEN 'search_path' = ANY(string_to_array(unnest(p.proconfig), '=')[1]) THEN 'SEARCH PATH SET ✅'
--     ELSE 'NO SEARCH PATH SET ❌'
--   END as security_status
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.prokind = 'f'
--   AND p.proname IN (
--     'update_updated_at_column',
--     'reset_daily_free_decks',
--     'increment_view_count',
--     'find_image_remix',
--     'search_similar_images',
--     'deduct_tokens',
--     'increment_import_count',
--     'increment_like_count',
--     'decrement_like_count',
--     'increment_remix_count',
--     'decrement_remix_count'
--   )
-- ORDER BY function_name;
