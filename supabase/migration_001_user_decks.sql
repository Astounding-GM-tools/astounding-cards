-- Migration: Add user_decks table and update published_decks
-- Purpose: Separate private working copies from public gallery snapshots
-- Date: 2025-11-20

-- ============================================================================
-- STEP 1: Add missing columns to published_decks
-- ============================================================================

ALTER TABLE published_decks
  ADD COLUMN IF NOT EXISTS source_deck_id UUID,
  ADD COLUMN IF NOT EXISTS import_count INTEGER DEFAULT 0 CHECK (import_count >= 0),
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
  ADD COLUMN IF NOT EXISTS image_style TEXT DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS layout TEXT DEFAULT 'poker' CHECK (layout IN ('poker', 'tarot'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_published_decks_source_deck_id ON published_decks(source_deck_id);
CREATE INDEX IF NOT EXISTS idx_published_decks_import_count ON published_decks(import_count DESC);
CREATE INDEX IF NOT EXISTS idx_published_decks_like_count ON published_decks(like_count DESC);

-- ============================================================================
-- STEP 2: Create user_decks table (private working copies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Deck data
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT DEFAULT 'classic',
  image_style TEXT DEFAULT 'classic',
  layout TEXT DEFAULT 'poker' CHECK (layout IN ('poker', 'tarot')),
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',

  -- Sync control
  is_synced BOOLEAN DEFAULT true, -- false = local-only, true = synced to cloud

  -- Publishing link (if this deck is published)
  published_deck_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_decks
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id ON user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_published_deck_id ON user_decks(published_deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_last_edited ON user_decks(last_edited DESC);

-- ============================================================================
-- STEP 3: Add foreign key constraint (after both tables exist)
-- ============================================================================

-- Add FK from published_decks to user_decks
ALTER TABLE published_decks
  ADD CONSTRAINT fk_published_decks_source_deck_id
  FOREIGN KEY (source_deck_id) REFERENCES user_decks(id) ON DELETE SET NULL;

-- Add FK from user_decks to published_decks
ALTER TABLE user_decks
  ADD CONSTRAINT fk_user_decks_published_deck_id
  FOREIGN KEY (published_deck_id) REFERENCES published_decks(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 4: Row Level Security (RLS) Policies for user_decks
-- ============================================================================

ALTER TABLE user_decks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own decks
CREATE POLICY "Users can read own user_decks" ON user_decks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own decks
CREATE POLICY "Users can insert own user_decks" ON user_decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own decks
CREATE POLICY "Users can update own user_decks" ON user_decks
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own decks
CREATE POLICY "Users can delete own user_decks" ON user_decks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: Triggers for auto-updating timestamps
-- ============================================================================

-- Reuse existing update_updated_at_column function for last_edited
CREATE TRIGGER update_user_decks_last_edited
BEFORE UPDATE ON user_decks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Note: This will update last_edited to NOW() on every update
-- If you want to rename it, create a new function:
-- CREATE OR REPLACE FUNCTION update_last_edited_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.last_edited = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Helper functions
-- ============================================================================

-- Function to increment import count on published decks
CREATE OR REPLACE FUNCTION increment_import_count(deck_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE published_decks
  SET import_count = import_count + 1
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment like count on published decks (for Phase 2)
CREATE OR REPLACE FUNCTION increment_like_count(deck_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE published_decks
  SET like_count = like_count + 1
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement like count on published decks (for Phase 2)
CREATE OR REPLACE FUNCTION decrement_like_count(deck_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE published_decks
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Data migration (if you have existing published_decks)
-- ============================================================================

-- This creates user_decks entries for existing published decks
-- Run this ONLY if you have existing data and want to preserve it
--
-- INSERT INTO user_decks (
--   id,
--   user_id,
--   title,
--   description,
--   theme,
--   image_style,
--   layout,
--   cards,
--   tags,
--   is_synced,
--   published_deck_id,
--   created_at,
--   last_edited
-- )
-- SELECT
--   uuid_generate_v4(), -- Generate new ID for user_deck
--   user_id,
--   title,
--   description,
--   theme,
--   COALESCE(image_style, 'classic'),
--   COALESCE(layout, 'poker'),
--   cards,
--   tags,
--   true, -- All existing published decks are synced
--   id, -- Link to the published_deck
--   created_at,
--   updated_at
-- FROM published_decks
-- WHERE user_id IS NOT NULL; -- Only migrate user-created decks, not admin-curated
--
-- -- Then link published_decks back to user_decks
-- UPDATE published_decks
-- SET source_deck_id = (
--   SELECT id FROM user_decks WHERE user_decks.published_deck_id = published_decks.id
-- )
-- WHERE user_id IS NOT NULL;

-- ============================================================================
-- STEP 8: Comments for documentation
-- ============================================================================

COMMENT ON TABLE user_decks IS 'Private working copies of decks, synced across user devices';
COMMENT ON COLUMN user_decks.is_synced IS 'true = synced to cloud, false = local-only';
COMMENT ON COLUMN user_decks.published_deck_id IS 'Links to published_decks if this deck is published';
COMMENT ON COLUMN published_decks.source_deck_id IS 'Links to the user_decks working copy';
COMMENT ON COLUMN published_decks.import_count IS 'Number of times this deck was imported/added to library';
COMMENT ON COLUMN published_decks.like_count IS 'Number of likes (Phase 2 feature)';

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration)
-- ============================================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_decks'
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'user_decks';

-- Count records
-- SELECT
--   (SELECT COUNT(*) FROM user_decks) as user_decks_count,
--   (SELECT COUNT(*) FROM published_decks) as published_decks_count;
