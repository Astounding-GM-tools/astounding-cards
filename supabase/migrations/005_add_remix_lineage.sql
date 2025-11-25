-- Migration: Add remix lineage tracking
-- Purpose: Track when published decks are remixes of other published decks
-- Date: 2025-11-25

-- Add remix_of column to published_decks
ALTER TABLE published_decks
  ADD COLUMN IF NOT EXISTS remix_of UUID REFERENCES published_decks(id) ON DELETE SET NULL;

-- Add index for remix queries (find all remixes of a deck)
CREATE INDEX IF NOT EXISTS idx_published_decks_remix_of ON published_decks(remix_of);

-- Add remix_count for tracking popularity
ALTER TABLE published_decks
  ADD COLUMN IF NOT EXISTS remix_count INTEGER DEFAULT 0 CHECK (remix_count >= 0);

-- Function to increment remix count
CREATE OR REPLACE FUNCTION increment_remix_count(deck_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE published_decks
  SET remix_count = remix_count + 1
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement remix count (if remix is deleted)
CREATE OR REPLACE FUNCTION decrement_remix_count(deck_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE published_decks
  SET remix_count = GREATEST(0, remix_count - 1)
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON COLUMN published_decks.remix_of IS 'Links to the published deck this was remixed from (NULL for original creations)';
COMMENT ON COLUMN published_decks.remix_count IS 'Number of times this deck has been remixed by others';
