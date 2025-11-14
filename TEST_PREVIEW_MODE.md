# Preview Mode Testing Guide

## Setup

1. Make sure dev server is running: `npm run dev`
2. Open http://localhost:5173/next in your browser
3. Open browser console (for dev tools access)

## Test 1: Create a Sample Deck and Generate Share URL

### Steps:
```javascript
// In browser console:
await nextDevTools.setupTestEnvironment()
```

This will:
- Clear any existing data
- Create a sample deck with multiple cards
- Load it in the app

### Expected Result:
- You should see the sample deck loaded in the app
- Navigation should work

### Generate Share URL:
1. Click the "Share" button in the header
2. Copy the generated share URL (should look like: `http://localhost:5173/welcome-to-astounding-cards#data=...`)

## Test 2: Preview Mode - View Without Importing

### Steps:
1. Open a new **incognito/private window** (to ensure clean state)
2. Paste the share URL from Test 1
3. Press Enter

### Expected Results:
✅ **Should see:**
- Loading spinner briefly
- Preview header with deck title, description, card count
- "💾 Import to Library" button
- "Cancel" button
- Grid of cards with Front/Back toggle buttons
- Cards should display correctly
- Clicking Front/Back buttons should toggle card sides
- Cards should NOT open edit dialog (they're in preview mode)

❌ **Should NOT see:**
- "Import Successful" message
- Automatic redirect to /next
- Cards being saved to database yet

### Verify No Database Write:
```javascript
// In browser console (in the preview window):
await nextDevTools.getDatabaseInfo()
```

Should show: `{ deckCount: 0, totalCards: 0 }`

## Test 3: Import from Preview

### Steps:
1. While viewing the preview (from Test 2), click "💾 Import to Library"
2. Wait for the import to complete

### Expected Results:
✅ **Should see:**
- Button shows "Importing..." with spinner briefly
- Success toast: "🎉 Deck imported to your library!"
- Redirect to /next with the deck loaded
- Can now edit cards by clicking them

### Verify Database Write:
```javascript
// In browser console:
await nextDevTools.getDatabaseInfo()
```

Should show deck and cards in database

## Test 4: Cancel Preview

### Steps:
1. Open the share URL again in a new incognito window
2. Click "Cancel" button

### Expected Results:
✅ **Should:**
- Navigate to /next (main app)
- No deck imported
- Database unchanged

## Test 5: Preview with Local Changes (Conflict Detection)

### Setup:
1. In your main browser window, make changes to the imported deck:
   - Edit a card title
   - Add a new card
2. Generate a NEW share URL (it will have updated data)
3. Copy the URL

### Steps:
1. The deck is already in your database (from Test 3)
2. Paste the NEW share URL in the SAME browser window
3. Click "💾 Import to Library"

### Expected Results:
✅ **Should see:**
- Preview loads correctly
- When you click Import, the **Merge Tool** appears (because local changes conflict with shared version)
- You can review conflicts and choose how to resolve them

## Test 6: Responsive Design

### Steps:
1. Open preview URL
2. Resize browser window or use mobile device view

### Expected Results:
✅ **Mobile view:**
- Preview header stacks vertically
- Import/Cancel buttons become full width
- Card grid becomes single column
- Front/Back buttons remain functional

## Test 7: Direct Deck Slug (No Hash Data)

### Steps:
1. Visit a URL like: `http://localhost:5173/test-heroes` (no hash)
2. This simulates visiting a curated deck slug

### Expected Results:
- If curated deck exists in Supabase: Shows preview
- If no curated deck: Shows error "Load Failed"

## Common Issues & Fixes

### Issue: Preview shows placeholder text
**Fix:** DeckPreview component might not be importing correctly. Check browser console for errors.

### Issue: Cards don't display
**Fix:** Check if Card/CardFront/CardBack components are loading correctly. Inspect network tab.

### Issue: Import button doesn't work
**Fix:** Check console for errors in handleImport function.

### Issue: Merge tool doesn't appear with conflicts
**Fix:** Verify the three-layer merge is detecting conflicts correctly.

## Success Criteria

All tests should pass with expected results. The preview mode should:
- ✅ Load deck data without importing
- ✅ Display cards in read-only mode
- ✅ Allow explicit import action
- ✅ Handle conflicts with merge tool
- ✅ Work responsively on mobile
- ✅ Show appropriate error states

## Next Steps After Testing

Once preview mode is verified:
1. Create `/gallery` route for browsing all published decks
2. Add API endpoint to list published decks from Supabase
3. Add thumbnails and deck metadata display
4. Implement pagination for large galleries
