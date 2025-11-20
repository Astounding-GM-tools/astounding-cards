# Database Migration Guide: user_decks Table

## Overview
This migration separates private working copies (`user_decks`) from public gallery snapshots (`published_decks`).

**Impact:** This is a breaking change that requires code updates after running the migration.

---

## Pre-Migration Checklist

### 1. **Backup Your Database** ⚠️
```sql
-- In Supabase SQL Editor, verify you can restore if needed
-- Supabase keeps automatic backups, but good to check
```

### 2. **Check Existing Data**
```sql
-- How many published decks exist?
SELECT COUNT(*) as total_published_decks FROM published_decks;

-- How many are user-created vs admin-curated?
SELECT
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as user_decks,
  COUNT(*) FILTER (WHERE user_id IS NULL) as admin_decks
FROM published_decks;
```

### 3. **Note Down Results**
- Total published decks: _______
- User-created decks: _______
- Admin-curated decks: _______

---

## Migration Execution

### Step 1: Run Core Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy **STEPS 1-6** from `migration_001_user_decks.sql`
3. Execute
4. ✅ Verify no errors

### Step 2: Decide on Data Migration

**Option A: You have NO existing published decks**
- Skip STEP 7 entirely
- You're done! ✅

**Option B: You have existing published decks and want to preserve them**
- Uncomment STEP 7 in the migration file
- This creates `user_decks` entries for each existing published deck
- Execute STEP 7
- ✅ Verify data was copied correctly:

```sql
-- Verify migration worked
SELECT
  pd.title as published_title,
  ud.title as user_deck_title,
  pd.id as published_id,
  ud.id as user_deck_id
FROM published_decks pd
LEFT JOIN user_decks ud ON ud.published_deck_id = pd.id
WHERE pd.user_id IS NOT NULL;

-- Should show matching titles for all user-created decks
```

### Step 3: Verification
Run these queries to confirm success:

```sql
-- Check user_decks table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_decks'
ORDER BY ordinal_position;

-- Check RLS policies are active
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'user_decks';

-- Check foreign keys are set up
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('user_decks', 'published_decks')
  AND tc.constraint_type = 'FOREIGN KEY';
```

---

## Post-Migration: Code Updates Required

After running the migration, you MUST update the following code:

### 1. API Routes
- [ ] Create `/api/user-decks/` endpoints (CRUD operations)
- [ ] Update `/api/decks/publish/+server.ts` (copy user_deck → published_deck)
- [ ] Update `/api/decks/gallery/+server.ts` (no changes needed, already uses published_decks)

### 2. Stores
- [ ] Update `deckStore.svelte.ts` to sync with `user_decks` table
- [ ] Add sync logic for authenticated users

### 3. UI Components
- [ ] Update publish flow to copy from user_deck → published_deck
- [ ] Add "Update Published" action (re-copy when user wants to push changes)
- [ ] Update import flow to save to user_decks (if authenticated)

---

## Rollback Plan (if needed)

If something goes wrong, you can rollback:

```sql
-- Drop the new table (will cascade and remove FKs)
DROP TABLE IF EXISTS user_decks CASCADE;

-- Remove columns from published_decks
ALTER TABLE published_decks
  DROP COLUMN IF EXISTS source_deck_id,
  DROP COLUMN IF EXISTS import_count,
  DROP COLUMN IF EXISTS like_count,
  DROP COLUMN IF EXISTS image_style,
  DROP COLUMN IF EXISTS layout;

-- Drop functions
DROP FUNCTION IF EXISTS increment_import_count(UUID);
DROP FUNCTION IF EXISTS increment_like_count(UUID);
DROP FUNCTION IF EXISTS decrement_like_count(UUID);
```

**Then restore from Supabase backup if needed.**

---

## Testing After Migration

### Test 1: Can authenticated users create user_decks?
```sql
-- As an authenticated user (run in SQL editor with auth context)
INSERT INTO user_decks (user_id, title, cards)
VALUES (auth.uid(), 'Test Deck', '[]'::jsonb)
RETURNING *;
```

### Test 2: Can users only see their own decks?
```sql
-- Should only return your own decks
SELECT * FROM user_decks;
```

### Test 3: RLS prevents cross-user access?
```sql
-- Try to access another user's deck (should fail or return empty)
-- You'll need to test this from the app, not SQL editor
```

---

## Migration Status Tracking

- [ ] Pre-migration backup verified
- [ ] Existing data checked
- [ ] Core migration (Steps 1-6) executed successfully
- [ ] Data migration (Step 7) executed (if applicable)
- [ ] Verification queries passed
- [ ] API routes updated
- [ ] Store logic updated
- [ ] UI components updated
- [ ] End-to-end testing completed

---

## Next Steps After Migration

Once the database migration is complete, proceed to:

1. **Update API routes** - Create user_decks endpoints
2. **Update deckStore** - Sync to user_decks instead of published_decks
3. **Update publish logic** - Copy user_deck → published_deck
4. **Test thoroughly** - All workflows (create, edit, publish, update)

See implementation guide in `docs/USER_DECKS_IMPLEMENTATION.md` (to be created next).
