# Quick Test - Preview Mode (Post-Fix)

## What Was Fixed

1. ✅ Share URL generation now creates proper hash URLs (`/slug#data=...`)
2. ✅ Preview page keeps the hash during preview (doesn't clear it immediately)
3. ✅ Hash only cleared after successful import

## Test Steps (3 minutes)

### 1. Generate Share URL

1. Open http://localhost:5173/next
2. In console: `await nextDevTools.setupTestEnvironment()`
3. Click Share button (top right)
4. Click "Generate Share URL"
5. **Expected**: URL should look like:
   ```
   http://localhost:5173/welcome-to-astounding-cards#data=eyJpZCI6...
   ```
   (with `#data=` and a long base64 string)

### 2. Test Preview Mode

1. Copy the share URL
2. Open **incognito/private window**
3. Paste the URL
4. **Expected**:
   - ✅ URL still shows `#data=...` in address bar
   - ✅ Preview page displays with deck info
   - ✅ "Import to Library" button visible
   - ✅ Card grid shows all cards
   - ✅ Front/Back toggle buttons work

### 3. Test Import

1. Click "Import to Library"
2. **Expected**:
   - ✅ Success toast: "🎉 Deck imported to your library!"
   - ✅ URL changes to just `/welcome-to-astounding-cards` (hash removed)
   - ✅ Shows success screen with:
     - Green checkmark ✅
     - "🎉 Import Successful!"
     - "Deck imported and saved to your library."
     - "Open Deck" button

3. Click "Open Deck"
4. **Expected**:
   - ✅ Redirects to `/next`
   - ✅ Deck is loaded and editable

## Summary

**All fixed! 🎉**

The flow now works correctly:
1. Share URL is properly generated with hash format
2. Preview page shows deck without importing
3. Hash stays in URL during preview
4. Import button saves to database
5. Success screen appears after import
6. User can open the deck in the editor

## If Issues Occur

### URL has `?data=` instead of `#data=`
- This means the old query format is being used
- Check that ShareUrlDialog is using the updated `createShareUrl` function

### Preview immediately imports (no preview screen)
- Check that onMount doesn't auto-import
- Verify `imported` state starts as `false`

### Hash disappears from URL immediately
- Check that line 84-87 doesn't call `replaceState` during preview
- Hash should only be cleared in `handleImport` after successful import
