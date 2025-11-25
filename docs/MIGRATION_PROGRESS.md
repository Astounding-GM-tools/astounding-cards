# Migration Progress: user_decks Two-Table System

**Date**: 2025-11-20
**Status**: Phase 1 Complete - API Layer Done ✅

---

## ✅ Completed

### 1. Database Migration
- ✅ Created `user_decks` table (private working copies)
- ✅ Added columns to `published_decks` (source_deck_id, import_count, like_count, image_style, layout)
- ✅ Set up RLS policies for user_decks
- ✅ Created foreign key relationships
- ✅ Added helper functions (increment_import_count, increment_like_count, etc.)
- ✅ Executed migration in Supabase successfully

**Files**: `supabase/EXECUTE_THIS_MIGRATION.sql`

### 2. API Routes Created

#### `/api/user-decks` - Full CRUD for private working copies
- ✅ GET - List all user's decks
- ✅ POST - Create/upsert deck (auto-sync from client)
- ✅ PATCH - Update specific fields
- ✅ DELETE - Delete user deck

**Features:**
- Client provides ID to ensure IndexedDB sync consistency
- Upsert logic (create if not exists, update if exists)
- Ownership verification on all operations
- Tracks `published_deck_id` link

**File**: `src/routes/api/user-decks/+server.ts`

#### `/api/decks/publish` - Updated for two-table system
- ✅ NEW PATH: Publish from `user_decks` (pass `userDeckId`)
  - First publish → Creates `published_decks` entry, links both tables
  - Update published → Copies current `user_deck` data to `published_deck`
- ✅ LEGACY PATH: Direct publish (backwards compatibility)

**Key Logic:**
1. Check if `user_deck` already has `published_deck_id`
2. If yes → UPDATE existing published deck
3. If no → CREATE new published deck and link

**File**: `src/routes/api/decks/publish/+server.ts` (modified)

---

## 🚧 In Progress

### 3. Deck Store Sync Logic

**What needs to be done:**
Update `src/lib/next/stores/deckStore.svelte.ts` to:
- Auto-sync deck changes to `user_decks` (if authenticated)
- Call `/api/user-decks` (POST/PATCH) after local changes
- Track `published_deck_id` in deck metadata

**Sync Strategy (Auto-sync):**
- Every deck change → Update IndexedDB immediately
- Background: POST/PATCH to `/api/user-decks`
- Last-write-wins (no conflict resolution for MVP)

**File to modify**: `src/lib/next/stores/deckStore.svelte.ts`

---

## 📋 Pending

### 4. UI Component Updates

#### A. Publish Flow
**File**: Wherever publish is triggered (need to identify)
- Change API call to pass `userDeckId` instead of full deck data
- Example:
  ```typescript
  await fetch('/api/decks/publish', {
    method: 'POST',
    body: JSON.stringify({
      userDeckId: deck.id, // NEW: Just pass the ID
      visibility: 'public'
    })
  });
  ```

#### B. Context Menu Actions
**File**: `src/lib/next/components/nav/DeckActions.svelte`
- Add "Update Published" action (when `deck.meta.publishedDeckId` exists)
- Change "Publish" label dynamically:
  - If not published: "Publish to Gallery"
  - If published: "Update Published"
- Add "Unpublish" to Share dropdown

#### C. Deck Metadata Tracking
**Files**: `src/lib/next/types/deck.ts`, IndexedDB schema
- Add `publishedDeckId?: string` to deck metadata
- Store this when publish succeeds
- Use it to determine UI state

### 5. Testing
- [ ] Create new deck (authenticated) → Should auto-sync to `user_decks`
- [ ] Edit deck → Should update `user_decks`
- [ ] Publish deck → Should create `published_decks` entry
- [ ] Edit published deck → Should only update `user_decks`, NOT `published_decks`
- [ ] Click "Update Published" → Should copy to `published_decks`
- [ ] Delete deck → Should remove from `user_decks`
- [ ] Unpublish → Should remove from `published_decks`, keep `user_deck`

---

## 🎯 Current Architecture

```
┌─────────────────────────────────────────────────────┐
│                    USER WORKFLOW                     │
└─────────────────────────────────────────────────────┘

1. CREATE DECK (authenticated)
   ├─> IndexedDB (local, immediate)
   └─> user_decks table (cloud sync, background)

2. EDIT DECK
   ├─> IndexedDB (immediate)
   └─> user_decks (background sync via POST/PATCH)

3. PUBLISH TO GALLERY
   ├─> POST /api/decks/publish { userDeckId }
   ├─> Creates published_decks entry (snapshot)
   ├─> Links: user_decks.published_deck_id ↔ published_decks.id
   └─> Returns published_deck info

4. KEEP EDITING (after publish)
   ├─> IndexedDB + user_decks updates
   └─> published_decks stays FROZEN ✅

5. UPDATE PUBLISHED VERSION
   ├─> POST /api/decks/publish { userDeckId }
   ├─> Detects user_deck already has published_deck_id
   ├─> Copies current user_deck → published_deck
   └─> Increments version number

6. DELETE DECK
   ├─> DELETE /api/user-decks?id=deckId
   ├─> Removes user_deck
   └─> Published deck remains (orphaned snapshot)
```

---

## 📊 Database Schema Summary

### `user_decks` (Private Working Copies)
```sql
- id (UUID, matches IndexedDB ID)
- user_id (owner)
- title, description, theme, image_style, layout, cards, tags
- is_synced (true = cloud synced, false = local-only)
- published_deck_id (NULL if not published)
- created_at, last_edited
```

### `published_decks` (Public Gallery Snapshots)
```sql
- id (UUID)
- user_id (owner)
- slug (URL identifier)
- title, description, theme, image_style, layout, cards, tags
- source_deck_id (links to user_decks)
- import_count, like_count, view_count
- visibility ('public' | 'unlisted')
- version (increments on update)
- created_at, updated_at
```

### Relationships
- `user_decks.published_deck_id` → `published_decks.id` (FK, ON DELETE SET NULL)
- `published_decks.source_deck_id` → `user_decks.id` (FK, ON DELETE SET NULL)

---

## 🚀 Next Steps

### Immediate (Today)
1. **Update deckStore** with sync logic
2. **Update publish call** in UI to use new API
3. **Test basic workflow**: Create → Sync → Publish

### Tomorrow
1. **Add "Update Published" UI**
2. **Add unpublish functionality**
3. **Full end-to-end testing**
4. **Deploy and verify**

---

## 🔧 Key Implementation Details

### Auto-Sync Strategy
```typescript
// After every deck update in deckStore:
async function syncDeckToCloud(deck: Deck) {
  if (!isAuthenticated) return;

  await fetch('/api/user-decks', {
    method: 'POST', // POST handles upsert
    body: JSON.stringify({
      id: deck.id,
      title: deck.meta.title,
      theme: deck.meta.theme,
      image_style: deck.meta.imageStyle,
      layout: deck.meta.layout,
      cards: deck.cards,
      is_synced: true
    })
  });
}
```

### Publish/Update Logic
```typescript
// Publish button handler:
const isPublished = !!deck.meta.publishedDeckId;
const buttonLabel = isPublished ? 'Update Published' : 'Publish to Gallery';

async function handlePublish() {
  const response = await fetch('/api/decks/publish', {
    method: 'POST',
    body: JSON.stringify({
      userDeckId: deck.id, // API handles publish vs update
      visibility: 'public'
    })
  });

  const { deck: publishedDeck } = await response.json();

  // Store publishedDeckId in deck metadata
  await updateDeckMetadata(deck.id, {
    publishedDeckId: publishedDeck.id
  });
}
```

---

## 📝 Notes & Decisions

1. **Auto-sync enabled by default** - User doesn't need to click "Save to Cloud"
2. **Last-write-wins** - No conflict resolution for MVP
3. **Published decks are snapshots** - Freeze at publish time
4. **Update is manual** - User clicks "Update Published" to push changes
5. **Delete doesn't unpublish** - Published deck remains as orphaned snapshot
6. **Legacy path supported** - Old direct-publish still works for backwards compatibility

---

*Last updated: 2025-11-20 (API Layer Complete)*
