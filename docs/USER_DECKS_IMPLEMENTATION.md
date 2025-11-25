# User Decks Implementation Guide

## Overview
This guide covers the code changes needed after running the `user_decks` database migration.

**Goal:** Separate private working copies (user_decks) from public gallery snapshots (published_decks).

---

## Architecture Summary

### The Two-Table System

```
┌─────────────────────────────────────────────────────────────┐
│                         USER FLOW                            │
└─────────────────────────────────────────────────────────────┘

1. CREATE DECK (Authenticated)
   ├─> Save to IndexedDB (local, offline-first)
   └─> Auto-sync to user_decks table (private cloud)

2. EDIT DECK
   ├─> Update IndexedDB (immediate)
   └─> Sync to user_decks (background, if is_synced=true)

3. PUBLISH TO GALLERY
   ├─> Copy snapshot: user_decks → published_decks
   └─> Link: user_decks.published_deck_id = published_decks.id

4. KEEP EDITING (after publish)
   ├─> Updates go to user_decks only
   └─> published_decks stays frozen ✅

5. UPDATE PUBLISHED VERSION
   ├─> User clicks "Update Published"
   └─> Copy current snapshot: user_decks → published_decks
```

### Key Principles

1. **IndexedDB is source of truth for UI** (offline-first)
2. **user_decks syncs in background** (authenticated users only)
3. **published_decks is snapshot only** (frozen at publish time)
4. **Update Published = manual sync** (user controls when changes go public)

---

## Implementation Steps

### Step 1: Create User Decks API Routes

Create: `src/routes/api/user-decks/+server.ts`

```typescript
// GET /api/user-decks - List all user's decks
// POST /api/user-decks - Create new user deck
// PUT /api/user-decks/[id] - Update user deck
// DELETE /api/user-decks/[id] - Delete user deck
```

See detailed implementation below.

### Step 2: Update Deck Store

Modify: `src/lib/next/stores/deckStore.svelte.ts`

- Add sync logic for authenticated users
- Sync to `user_decks` instead of `published_decks`
- Add `published_deck_id` tracking

### Step 3: Update Publish Logic

Modify: `src/routes/api/decks/publish/+server.ts`

- Copy from `user_decks` → `published_decks`
- Link both tables with foreign keys

### Step 4: Update UI Components

- Add "Update Published" action (when deck is already published)
- Show sync status indicator
- Handle "Unpublish" flow

---

## Detailed Implementation

### 1. User Decks API Routes

**File: `src/routes/api/user-decks/+server.ts`**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// GET - List all user's decks
export const GET: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: decks, error } = await supabase
    .from('user_decks')
    .select('*')
    .eq('user_id', user.id)
    .order('last_edited', { ascending: false });

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ decks });
};

// POST - Create new user deck
export const POST: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, title, description, theme, image_style, layout, cards, tags, is_synced } = body;

  const { data: deck, error } = await supabase
    .from('user_decks')
    .insert({
      id, // Client provides ID (matches IndexedDB)
      user_id: user.id,
      title,
      description,
      theme,
      image_style,
      layout,
      cards,
      tags,
      is_synced: is_synced ?? true
    })
    .select()
    .single();

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ deck });
};

// PUT - Update user deck (sync changes)
export const PUT: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, title, description, theme, image_style, layout, cards, tags, is_synced } = body;

  // Verify ownership (RLS will also check, but explicit check for better error messages)
  const { data: existingDeck } = await supabase
    .from('user_decks')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existingDeck || existingDeck.user_id !== user.id) {
    return json({ error: 'Deck not found or unauthorized' }, { status: 404 });
  }

  const { data: deck, error } = await supabase
    .from('user_decks')
    .update({
      title,
      description,
      theme,
      image_style,
      layout,
      cards,
      tags,
      is_synced,
      last_edited: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ deck });
};

// DELETE - Delete user deck
export const DELETE: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return json({ error: 'Missing deck ID' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_decks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // RLS will check, but explicit for clarity

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ success: true });
};
```

---

### 2. Update Publish Logic

**File: `src/routes/api/decks/publish/+server.ts`**

Update the publish endpoint to:
1. Copy from `user_decks` (if authenticated)
2. Create snapshot in `published_decks`
3. Link both tables

```typescript
// Key changes:
// 1. Check if deck exists in user_decks
// 2. If yes, link with source_deck_id
// 3. If user_deck already has published_deck_id, update instead of create

// Pseudo-code:
const { data: userDeck } = await supabase
  .from('user_decks')
  .select('*')
  .eq('id', deckId)
  .eq('user_id', user.id)
  .single();

if (userDeck && userDeck.published_deck_id) {
  // CASE: Already published, update existing
  await supabase
    .from('published_decks')
    .update({
      title: userDeck.title,
      description: userDeck.description,
      cards: userDeck.cards,
      // ... other fields
    })
    .eq('id', userDeck.published_deck_id);
} else {
  // CASE: First publish, create new
  const { data: publishedDeck } = await supabase
    .from('published_decks')
    .insert({
      user_id: user.id,
      slug: generateSlug(userDeck.title),
      title: userDeck.title,
      cards: userDeck.cards,
      source_deck_id: userDeck.id,
      // ... other fields
    })
    .select()
    .single();

  // Link back to user_deck
  await supabase
    .from('user_decks')
    .update({ published_deck_id: publishedDeck.id })
    .eq('id', userDeck.id);
}
```

---

### 3. Update Deck Store

**File: `src/lib/next/stores/deckStore.svelte.ts`**

Add sync logic:

```typescript
class NextDeckStore {
  // ... existing code ...

  async syncToCloud(deckId: string) {
    const { user } = nextAuth;
    if (!user) return; // Not authenticated, skip sync

    const deck = await nextDb.getDeck(deckId);
    if (!deck) return;

    // Check if deck exists in cloud
    const { data: existingUserDeck } = await supabase
      .from('user_decks')
      .select('id')
      .eq('id', deckId)
      .single();

    if (existingUserDeck) {
      // Update existing
      await fetch('/api/user-decks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
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
    } else {
      // Create new
      await fetch('/api/user-decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
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
  }

  // Call syncToCloud after every update
  async updateDeckTitle(deckId: string, title: string) {
    // ... existing update logic ...
    await this.syncToCloud(deckId); // Add this
  }

  // Similarly for other update methods
}
```

---

### 4. Update UI Components

**Add "Update Published" action**

In `DeckActions.svelte`, change the publish button logic:

```typescript
// If deck is already published, show "Update Published"
// Otherwise, show "Publish to Gallery"

const publishLabel = isPublished ? 'Update Published' : 'Publish to Gallery';
```

**Add unpublish action**

In the Share dropdown, add:

```typescript
if (isPublished) {
  {
    label: 'Unpublish from Gallery',
    onClick: handleUnpublish
  }
}
```

---

## Testing Checklist

After implementing all changes:

- [ ] Create new deck (authenticated) → Saves to IndexedDB + user_decks
- [ ] Edit deck → Updates both IndexedDB and user_decks
- [ ] Publish deck → Creates published_decks entry, links to user_deck
- [ ] Edit published deck → Only updates user_decks, not published_decks
- [ ] Click "Update Published" → Copies user_deck changes to published_decks
- [ ] Unpublish → Removes from gallery, keeps user_deck
- [ ] Delete deck → Removes from both IndexedDB and user_decks
- [ ] Import from gallery → Saves to IndexedDB (+ user_decks if authenticated)

---

## Migration Timeline Estimate

1. **Database migration**: 30 minutes (SQL execution + verification)
2. **API routes**: 2-3 hours (create user-decks endpoints + update publish logic)
3. **Store updates**: 2-3 hours (add sync logic to deckStore)
4. **UI updates**: 1-2 hours (Update Published button, unpublish flow)
5. **Testing**: 2-3 hours (full workflow testing)

**Total: 8-12 hours** (roughly 1-1.5 days)

---

## Questions Before Starting?

Before diving into implementation, clarify:

1. **Existing data**: Do we need to migrate existing published_decks?
2. **Sync behavior**: Auto-sync on every change, or manual "Save to Cloud" button?
3. **Offline handling**: What happens when user edits while offline?
4. **Conflict resolution**: If user edits on two devices, how do we merge?

Let's answer these before proceeding!
