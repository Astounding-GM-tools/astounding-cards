-- ============================================================================
-- FIX: Drop incorrect trigger on user_decks table
-- Date: 2025-11-20
-- Problem: Trigger tries to update 'updated_at' but column is 'last_edited'
-- Solution: Drop trigger since we manually set last_edited in API
-- ============================================================================

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS update_user_decks_last_edited ON user_decks;

-- Verify trigger is gone
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'user_decks';

-- Note: We don't need this trigger because:
-- 1. Our API manually sets last_edited on every update
-- 2. The trigger was calling update_updated_at_column() which expects 'updated_at' column
-- 3. Our column is named 'last_edited' not 'updated_at'
