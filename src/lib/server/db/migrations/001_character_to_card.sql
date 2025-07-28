-- Rename characters table to cards
ALTER TABLE IF EXISTS characters RENAME TO cards;

-- Add type column with default
ALTER TABLE cards ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'character';

-- Convert public_traits and secret_traits to new format
ALTER TABLE cards ADD COLUMN IF NOT EXISTS traits JSONB DEFAULT '[]';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS secrets JSONB DEFAULT '[]';

-- Migrate existing trait data
UPDATE cards 
SET traits = (
  SELECT COALESCE(
    json_agg(
      CASE 
        WHEN trait->>'label' IS NOT NULL AND trait->>'description' IS NOT NULL
        THEN concat(trait->>'label', ': ', trait->>'description')
        ELSE trait::text
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(public_traits::jsonb) AS trait
);

UPDATE cards 
SET secrets = (
  SELECT COALESCE(
    json_agg(
      CASE 
        WHEN trait->>'label' IS NOT NULL AND trait->>'description' IS NOT NULL
        THEN concat(trait->>'label', ': ', trait->>'description')
        ELSE trait::text
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(secret_traits::jsonb) AS trait
);

-- Drop old columns
ALTER TABLE cards DROP COLUMN IF EXISTS public_traits;
ALTER TABLE cards DROP COLUMN IF EXISTS secret_traits;

-- Update stat column to ensure it matches card type
UPDATE cards
SET stat = NULL
WHERE (
  (type = 'character' AND (stat->>'type')::text != 'character') OR
  (type = 'item' AND (stat->>'type')::text != 'item') OR
  (type = 'location' AND (stat->>'type')::text != 'location')
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards (type);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards (deck_id);

-- Update version in decks table
UPDATE decks SET version = 1; 