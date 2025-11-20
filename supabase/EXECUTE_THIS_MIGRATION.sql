-- ============================================================================
-- MIGRATION: Add user_decks table - EXECUTE THIS IN SUPABASE SQL EDITOR
-- Date: 2025-11-20
-- Purpose: Separate private working copies from public gallery snapshots
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
  is_synced BOOLEAN DEFAULT true,

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

-- STEP 3: Add foreign key constraints
-- ============================================================================

ALTER TABLE published_decks
  ADD CONSTRAINT fk_published_decks_source_deck_id
  FOREIGN KEY (source_deck_id) REFERENCES user_decks(id) ON DELETE SET NULL;

ALTER TABLE user_decks
  ADD CONSTRAINT fk_user_decks_published_deck_id
  FOREIGN KEY (published_deck_id) REFERENCES published_decks(id) ON DELETE SET NULL;

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

-- STEP 5: Triggers for auto-updating timestamps
-- ============================================================================

CREATE TRIGGER update_user_decks_last_edited
BEFORE UPDATE ON user_decks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

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

-- Function to increment like count on published decks (Phase 2)
CREATE OR REPLACE FUNCTION increment_like_count(deck_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE published_decks
  SET like_count = like_count + 1
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement like count on published decks (Phase 2)
CREATE OR REPLACE FUNCTION decrement_like_count(deck_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE published_decks
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: Comments for documentation
-- ============================================================================

COMMENT ON TABLE user_decks IS 'Private working copies of decks, synced across user devices';
COMMENT ON COLUMN user_decks.is_synced IS 'true = synced to cloud, false = local-only';
COMMENT ON COLUMN user_decks.published_deck_id IS 'Links to published_decks if this deck is published';
COMMENT ON COLUMN published_decks.source_deck_id IS 'Links to the user_decks working copy';
COMMENT ON COLUMN published_decks.import_count IS 'Number of times this deck was imported/added to library';
COMMENT ON COLUMN published_decks.like_count IS 'Number of likes (Phase 2 feature)';

-- ============================================================================
-- VERIFICATION (run these after migration to verify success)
-- ============================================================================

-- Should show all columns including new ones
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_decks'
ORDER BY ordinal_position;

-- Should show 4 policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_decks';

-- Should show counts (user_decks will be 0 for new migration)
SELECT
  (SELECT COUNT(*) FROM user_decks) as user_decks_count,
  (SELECT COUNT(*) FROM published_decks) as published_decks_count;

-- ============================================================================
-- MIGRATION COMPLETE ✅
-- ============================================================================
