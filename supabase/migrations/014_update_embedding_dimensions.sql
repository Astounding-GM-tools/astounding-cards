-- Migration: Update Embedding Dimensions
-- Purpose: Change from 768 to 3072 dimensions for gemini-embedding-001
-- Date: 2025-12-09
-- Note: This requires re-embedding all existing images

-- Drop the old function first (it references the old vector type)
DROP FUNCTION IF EXISTS search_similar_images(vector, text, integer);

-- Alter the embedding column to use 3072 dimensions
ALTER TABLE community_images
ALTER COLUMN embedding TYPE vector(3072);

-- Recreate the search function with the new vector dimension
CREATE OR REPLACE FUNCTION search_similar_images(
  p_query_embedding vector(3072) DEFAULT NULL,
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
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  -- If no embedding provided, return random recent images
  IF p_query_embedding IS NULL THEN
    RETURN QUERY
    WITH originals AS (
      -- Get random original images (those with embeddings)
      SELECT
        ci.id,
        ci.url,
        ci.style,
        ci.created_at,
        0.5::FLOAT AS similarity_score  -- Neutral similarity for random results
      FROM community_images ci
      WHERE ci.embedding IS NOT NULL
      ORDER BY RANDOM()  -- Random selection
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
    ORDER BY wv.created_at DESC;  -- Most recent first for random results
  ELSE
    -- Original similarity search with embedding
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
  END IF;
END;
$$;

COMMENT ON FUNCTION search_similar_images IS 'Search community images by semantic similarity using vector embeddings (3072 dimensions for gemini-embedding-001), or return random images if no embedding provided.';

-- Note: All existing embeddings are now invalid and need to be regenerated
-- The embedding column has been changed from vector(768) to vector(3072)
