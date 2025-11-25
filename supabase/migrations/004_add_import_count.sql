-- Add import_count column to published_decks
-- This tracks how many times a deck has been imported by users
ALTER TABLE published_decks 
ADD COLUMN IF NOT EXISTS import_count INTEGER DEFAULT 0 CHECK (import_count >= 0);

-- Function to increment import count
CREATE OR REPLACE FUNCTION increment_import_count(deck_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE published_decks
  SET import_count = import_count + 1
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
