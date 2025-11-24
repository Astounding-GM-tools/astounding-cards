# Testing Guide: Two-Table Sync System

**Status**: Client-side integration complete ✅
**Ready for**: Manual testing and validation

---

## 🎯 What We've Built

### Phase 1: Database & API ✅
- `user_decks` table for private working copies
- Full CRUD API at `/api/user-decks`
- Updated publish API to copy from user_decks → published_decks

### Phase 2: Client Integration ✅
- Auto-sync to cloud after all deck mutations
- Updated `publishDeck()` to use new two-table system
- Smart detection: "Publish" vs "Update Published"

---

## 🧪 Testing Workflows

### Test 1: Create Deck & Auto-Sync
**Purpose**: Verify new decks sync to cloud automatically

1. **Sign in** to the app
2. **Create new deck** ("New Deck")
3. **Check Supabase** `user_decks` table:
   ```sql
   SELECT id, title, user_id, created_at
   FROM user_decks
   ORDER BY created_at DESC
   LIMIT 1;
   ```
4. **Expected**: Deck appears in `user_decks` with matching ID

**Success Criteria**:
- ✅ Deck created in IndexedDB
- ✅ Deck synced to `user_decks` table
- ✅ `user_id` matches your auth user
- ✅ `published_deck_id` is NULL

---

### Test 2: Edit Deck & Auto-Sync
**Purpose**: Verify edits sync to cloud

1. **Edit deck title** ("New Deck" → "My Cool Deck")
2. **Add a card**
3. **Edit the card** (change name, description, etc.)
4. **Check Supabase**:
   ```sql
   SELECT title, cards, last_edited
   FROM user_decks
   WHERE id = 'YOUR_DECK_ID';
   ```
5. **Expected**: Changes reflected in database

**Success Criteria**:
- ✅ Title updated in `user_decks`
- ✅ Cards array updated
- ✅ `last_edited` timestamp updated

---

### Test 3: First Publish
**Purpose**: Verify publish creates snapshot in gallery

1. **Create/edit a deck** with some cards
2. **Click "Publish to Gallery"**
3. **Check both tables**:
   ```sql
   -- User's working copy
   SELECT id, title, published_deck_id
   FROM user_decks
   WHERE id = 'YOUR_DECK_ID';

   -- Published snapshot
   SELECT id, slug, title, source_deck_id
   FROM published_decks
   WHERE source_deck_id = 'YOUR_DECK_ID';
   ```
4. **Expected**: Both tables linked

**Success Criteria**:
- ✅ `published_decks` entry created
- ✅ `user_decks.published_deck_id` points to published deck
- ✅ `published_decks.source_deck_id` points to user deck
- ✅ Published deck appears in gallery
- ✅ Deck metadata shows `published_slug`

---

### Test 4: Edit After Publish (Draft Changes)
**Purpose**: Verify edits don't affect published version

1. **Publish a deck** (Test 3)
2. **Edit the deck** (change title, add/remove cards)
3. **Check both tables**:
   ```sql
   -- Working copy (should have changes)
   SELECT title, cards
   FROM user_decks
   WHERE id = 'YOUR_DECK_ID';

   -- Published snapshot (should be UNCHANGED)
   SELECT title, cards
   FROM published_decks
   WHERE source_deck_id = 'YOUR_DECK_ID';
   ```
4. **Expected**: Changes only in `user_decks`, NOT in `published_decks`

**Success Criteria**:
- ✅ `user_decks` has new changes
- ✅ `published_decks` still has old version
- ✅ Gallery shows old version
- ✅ No errors in console

---

### Test 5: Update Published Version
**Purpose**: Verify "Update Published" pushes changes to gallery

1. **Edit a published deck** (Test 4)
2. **Click "Publish to Gallery"** again (should say "Updating...")
3. **Check published_decks**:
   ```sql
   SELECT title, cards, version, updated_at
   FROM published_decks
   WHERE source_deck_id = 'YOUR_DECK_ID';
   ```
4. **Expected**: Published deck updated with new data

**Success Criteria**:
- ✅ `published_decks` has new title/cards
- ✅ `version` incremented (e.g., 1 → 2)
- ✅ `updated_at` timestamp changed
- ✅ Gallery shows new version
- ✅ Button said "Updating published deck..." (not "Publishing...")

---

### Test 6: Unauthenticated User (No Sync)
**Purpose**: Verify app works without auth (no cloud sync)

1. **Sign out**
2. **Create a deck**
3. **Edit cards**
4. **Check**: No API calls to `/api/user-decks` (check Network tab)
5. **Expected**: Everything works locally, no sync

**Success Criteria**:
- ✅ Deck created in IndexedDB
- ✅ No API calls to `/api/user-decks`
- ✅ No errors in console
- ✅ App still fully functional

---

### Test 7: Cross-Device Sync (Future)
**Purpose**: Verify same user sees decks on multiple devices

1. **Sign in on Device A**
2. **Create/edit deck**
3. **Sign in on Device B** (same account)
4. **Expected**: Deck appears automatically (future feature)

**Status**: Not implemented yet (requires pull/merge logic)

---

## 🐛 Common Issues & Fixes

### Issue: Deck not syncing to cloud
**Check**:
- Is user authenticated? (check `nextAuth` store)
- Any errors in console?
- Network tab: Is `/api/user-decks` POST returning 200?

**Fix**:
- Verify Supabase session is valid
- Check RLS policies allow insert/update

### Issue: Publish fails
**Check**:
- Does deck exist in `user_decks`?
- Is `userDeckId` being sent in request?
- Any SQL errors in API logs?

**Fix**:
- Verify deck was synced first
- Check foreign key constraints

### Issue: "Update Published" creates new deck
**Check**:
- Does `deck.meta.published_deck_id` exist?
- Is API receiving correct `userDeckId`?

**Fix**:
- Verify metadata is persisted in IndexedDB
- Check API logic for update detection

---

## 📊 Database Queries for Debugging

### Check all user's decks
```sql
SELECT
  id,
  title,
  published_deck_id,
  created_at,
  last_edited
FROM user_decks
WHERE user_id = 'YOUR_USER_ID'
ORDER BY last_edited DESC;
```

### Check published decks with links
```sql
SELECT
  pd.id,
  pd.slug,
  pd.title,
  pd.version,
  pd.source_deck_id,
  ud.title as source_title
FROM published_decks pd
LEFT JOIN user_decks ud ON ud.id = pd.source_deck_id
WHERE pd.user_id = 'YOUR_USER_ID';
```

### Check orphaned decks
```sql
-- User decks without published version
SELECT id, title
FROM user_decks
WHERE published_deck_id IS NULL;

-- Published decks without source
SELECT id, slug, title
FROM published_decks
WHERE source_deck_id IS NULL;
```

---

## ✅ Success Checklist

Before considering this feature complete:

- [ ] Create deck → Syncs to cloud automatically
- [ ] Edit deck → Changes sync automatically
- [ ] Publish deck → Creates gallery entry
- [ ] Edit published deck → Changes stay draft
- [ ] Update published → Gallery reflects changes
- [ ] Unauthenticated → Works locally only
- [ ] No console errors during any workflow
- [ ] Network requests return 200 (check DevTools)
- [ ] Database foreign keys intact
- [ ] Gallery displays correct versions

---

## 🚀 Next Steps After Testing

Once all tests pass:
1. **Commit changes** with message: "feat: add cloud sync and two-table publish system"
2. **Update USER_ACTIONS_MAPPING.md** with actual implementation status
3. **Add unpublish UI** (DELETE from published_decks, keep user_deck)
4. **Add "My Published Decks" filter** in dashboard
5. **Deploy to staging/production**

---

*Generated: 2025-11-20*
*Ready for manual testing*
