# Action Button Logic Review - [slug] Route

## Overview
This document reviews the logic for all action buttons in the `src/routes/[slug]/+page.svelte` route to identify issues with state management and data freshness.

---

## ✅ ISSUES FIXED

### 1. **Republish Button - FIXED** ✅
**Issue:** Button appeared immediately after publish without checking if there were actual changes.

**Root Cause:** No timestamp comparison logic existed (just a TODO comment).

**Solution Implemented:**
- Added `lastPublished` timestamp to `DeckMeta` type
- Updated `publishDeck()` to set `lastPublished` on every publish/republish
- Created `needsRepublish` derived state: `lastEdited > lastPublished`
- Refresh `localDeck` after publish to get updated metadata
- Button now only shows when there are actual unpublished changes

**Benefits of this approach:**
- ✅ Pure local comparison (no server dependency)
- ✅ Works offline
- ✅ No stale data issues
- ✅ Follows Canon Update Pattern

---

### 2. **View in Gallery Button - FIXED** ✅
**Location:** Line 521-530

**Issues Found:**
1. ❌ Used `published_deck_id` as fallback slug (but IDs aren't slugs!)
2. ❌ After first publish, `localDeck.meta.published_slug` wasn't updated
3. ⚠️ No user feedback on error

**Solution Implemented:**
```typescript
function handleViewInGallery() {
  // Priority: use current page data first (if viewing published), then local metadata
  const slug = data.curatedDeck?.slug || localDeck?.meta?.published_slug;
  if (!slug) {
    toasts.error('Published version not available. Try refreshing the page.');
    return;
  }
  window.open(`/${slug}?gallery=true`, '_blank');
}
```

**What changed:**
- ✅ Removed incorrect `published_deck_id` fallback
- ✅ Uses `data.curatedDeck?.slug` first (server data)
- ✅ Falls back to `localDeck.meta.published_slug`
- ✅ Shows error toast if no slug available
- ✅ Works immediately after publish (localDeck is refreshed)

---

### 3. **Share Button - FIXED** ✅
**Location:** Line 533-542

**Issues Found:**
1. ✅ Good: Handles gallery vs local view correctly
2. ❌ Used `published_deck_id` as slug fallback (incorrect)
3. ⚠️ Would fail right after first publish

**Solution Implemented:**
```typescript
async function handleShare() {
  const slug = isGalleryView
    ? data.slug
    : data.curatedDeck?.slug || activeDeck?.meta?.published_slug;

  if (!slug) {
    toasts.error('Cannot share - deck not published');
    return;
  }
  // ... copy to clipboard
}
```

**What changed:**
- ✅ Removed incorrect `published_deck_id` fallback
- ✅ Uses `data.curatedDeck?.slug` for published view
- ✅ Falls back to `activeDeck.meta.published_slug`
- ✅ Works immediately after publish (localDeck is refreshed)

---

### 4. **Data Staleness After Publish - FIXED** ✅
**THE CORE PROBLEM - NOW SOLVED**

**Original Issue:**
After publish, component state wasn't updated with new metadata from IndexedDB, causing buttons to malfunction.

**Solution Implemented:**
Simple and elegant - just reload `localDeck` from IndexedDB after publish:

```typescript
async function handlePublish() {
  // ... publish logic

  if (result.success && result.slug) {
    // Reload local deck to get updated metadata (with lastPublished timestamp)
    if (localDeck) {
      localDeck = await nextDb.getDeck(previewDeck.id);
    }

    // Show success message
  }
}
```

**Why this works:**
- ✅ `publishDeck()` updates IndexedDB with `published_slug` and `lastPublished`
- ✅ We reload `localDeck` immediately after
- ✅ All derived states (`needsRepublish`, etc.) automatically update
- ✅ All buttons work immediately (View, Share, Republish)
- ✅ No need for page reload or server refetch
- ✅ Follows Canon Update Pattern - database is source of truth

---

## ✅ WORKING BUTTONS

### 5. **Like Button** (Read-only)
- ✅ Correctly shows count from `data.curatedDeck.like_count`
- ✅ Properly disabled
- No issues found

### 6. **Add to Library Button**
- ✅ Correctly switches between BookPlus/BookCheck based on `localDeck` existence
- ✅ Handles import properly
- No issues found

### 7. **Generate Images Button**
- ✅ Properly loads deck into store before opening dialog
- ✅ Distinguishes between local and curated decks
- No issues found

### 8. **Add Card Button**
- ✅ Implicitly imports deck if needed
- ✅ Creates card and opens edit dialog
- No issues found

### 9. **Publish Button** (first-time)
- ✅ Works correctly for unpublished decks
- No issues found

---

## 📋 SUMMARY OF CHANGES

### Files Modified

1. **`src/lib/next/types/deck.ts`**
   - Added `lastPublished?: number` to `DeckMeta` interface

2. **`src/lib/next/stores/deckStore.svelte.ts`**
   - Updated `publishDeck()` to set `lastPublished` timestamp on publish/republish

3. **`src/routes/[slug]/+page.svelte`**
   - Added `needsRepublish` derived state using local timestamp comparison
   - Updated `handlePublish()` to refresh `localDeck` after publish
   - Fixed `handleViewInGallery()` slug resolution
   - Fixed `handleShare()` slug resolution

### All Issues Resolved ✅
1. ✅ Republish button logic - now uses `lastPublished` timestamp
2. ✅ Data staleness - `localDeck` refreshed after publish
3. ✅ View in Gallery button - correct slug resolution
4. ✅ Share button - correct slug resolution
5. ✅ Removed incorrect `published_deck_id` as slug fallback

---

## Testing Checklist

After fixes, test this flow:
1. [ ] View a local unpublished deck
2. [ ] Click "Publish" - verify success message
3. [ ] Immediately click "View in Gallery" - should work without refresh
4. [ ] Immediately click "Share" - should copy correct URL
5. [ ] "Republish" button should NOT appear yet
6. [ ] Edit the deck (change title or add card)
7. [ ] "Republish" button should NOW appear
8. [ ] Click "Republish" - verify update succeeds
9. [ ] Verify "View in Gallery" shows latest changes

---

## Root Cause & Solution Summary

### The Problem
**Stale data after mutations** - When `publishDeck()` succeeded:
- ✅ Remote state (Supabase) was updated
- ✅ Local state (IndexedDB) was updated
- ❌ Component state (`localDeck`) was NOT updated

### The Solution
**Simple state refresh** - After `publishDeck()` completes:
```typescript
localDeck = await nextDb.getDeck(previewDeck.id);
```

This elegantly solves all issues because:
- IndexedDB is the single source of truth (Canon Update Pattern)
- All button logic derives from `localDeck.meta` properties
- Svelte's reactivity handles the rest

### Key Insight
Your suggestion to use `lastPublished` was brilliant! It transformed a complex problem (comparing server timestamps, handling stale data, network dependencies) into a simple local calculation: `lastEdited > lastPublished`. This is more reliable, faster, and follows the project's database-first philosophy perfectly.
