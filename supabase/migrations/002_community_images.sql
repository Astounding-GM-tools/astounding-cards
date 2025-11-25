-- Community Images Table
-- Each row represents one image in one style
-- Remixes reference the source_image_id

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS community_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who generated this image (for credit tracking)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Image location
  url TEXT NOT NULL UNIQUE,
  r2_key TEXT NOT NULL, -- e.g., "images/abc123.png" for cleanup
  
  -- Style of this image
  style TEXT NOT NULL CHECK (style IN ('classic', 'modern', 'inked')),
  
  -- Remix tracking
  -- NULL = original image
  -- Non-null = this is a remix of another image
  source_image_id UUID REFERENCES community_images(id) ON DELETE SET NULL,
  
  -- Semantic search (only on originals to save cost)
  -- This is the embedding of the optimized prompt used to generate the image
  -- Remixes inherit searchability through source_image_id
  embedding vector(768),
  
  -- Optional metadata for display/search (future)
  card_title TEXT,
  
  -- Cost tracking (for user transaction history)
  cost_tokens INTEGER NOT NULL DEFAULT 100,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding remixes: "Does an inked version of image X exist?"
CREATE INDEX IF NOT EXISTS idx_community_images_source_style 
  ON community_images(source_image_id, style);

-- Index for user's generation history
CREATE INDEX IF NOT EXISTS idx_community_images_user_created 
  ON community_images(user_id, created_at DESC);

-- Index for browsing newest images
CREATE INDEX IF NOT EXISTS idx_community_images_created_at 
  ON community_images(created_at DESC);

-- Vector index for semantic similarity search
-- Using ivfflat for good balance of speed and accuracy
-- lists parameter: sqrt(total_rows) is a good default
CREATE INDEX IF NOT EXISTS idx_community_images_embedding 
  ON community_images USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Row Level Security
ALTER TABLE community_images ENABLE ROW LEVEL SECURITY;

-- Everyone can read community images (public library)
CREATE POLICY "Anyone can read community images" ON community_images
  FOR SELECT USING (true);

-- Authenticated users can insert images (via API)
CREATE POLICY "Authenticated users can insert images" ON community_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to find existing remix
CREATE OR REPLACE FUNCTION find_image_remix(
  p_source_image_id UUID,
  p_style TEXT
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  created_at TIMESTAMPTZ
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search images by semantic similarity
-- Returns originals with their variants grouped
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE community_images IS 'Community library of AI-generated images with style variants';
COMMENT ON COLUMN community_images.source_image_id IS 'NULL for originals, references source image for remixes';
COMMENT ON COLUMN community_images.embedding IS 'Vector embedding of optimized prompt for semantic search (originals only)';
COMMENT ON COLUMN community_images.cost_tokens IS 'Tokens spent to generate (for user transaction history)';
COMMENT ON COLUMN community_images.r2_key IS 'R2 bucket key for image management and cleanup';
