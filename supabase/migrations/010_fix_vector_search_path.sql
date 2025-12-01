-- Migration: Fix Vector Search Path
-- Purpose: Add extensions schema to search_path for vector operations
-- Date: 2025-12-01
-- Issue: vector operator <=> not found because extensions schema not in search_path

-- Function to search images by semantic similarity
-- Fixed: Added 'extensions' to search_path for vector operators
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
SET search_path = public, extensions, pg_temp
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

COMMENT ON FUNCTION search_similar_images IS 'Search community images by semantic similarity using vector embeddings. Requires extensions schema in search_path for vector operators.';
