# Phase 1B: Public Gallery - Next Steps

**Status**: Header/Nav cleanup complete (6 commits, -197 lines)

## Completed Today ✅
- Consolidated DeckActions component (unified all deck actions)
- MergeTool now in Dialog system
- Like/Import functionality with counts (import_count from DB)
- Delete deck with confirmation dialog
- Print size in overflow menu (Small/Big labels)
- [slug]/+page.svelte reduced from 792 to ~620 lines (21% reduction)

## Immediate Next Steps 🎯

### 1. Gallery Page Polish
- **File**: `src/routes/next/gallery/+page.svelte`
- Test search/filter functionality
- Verify deck cards display correctly
- Check "Import" flow from gallery
- Mobile responsiveness

### 2. Dashboard Integration
- **File**: `src/routes/+page.svelte`
- Ensure "Publish to Gallery" button works
- Test deck switcher
- Verify "New Deck" and "Generate" flows

### 3. Publishing Workflow
- Test full flow: Create → Edit → Publish → View in Gallery
- Verify Update Published Version works
- Check unpublish functionality
- Ensure `import_count` increments correctly

### 4. Import/Like System
- Verify import button only shows for non-owned decks
- Test filled heart state (when you have local copy)
- Ensure count displays correctly
- Test import with conflicts → MergeTool dialog

### 5. Delete Functionality
- Test delete from [slug] page
- Test delete from dashboard/deck manager
- Verify navigation after delete
- Check unpublish when deleting published deck

## Technical Debt / Future Improvements 📝

### Near-term (Phase 1)
- [ ] Add error boundaries for API failures
- [ ] Loading states for all async operations
- [ ] Toast messages consistency check
- [ ] Print layout testing (poker vs tarot)
- [ ] Mobile menu overflow behavior

### Future (Phase 2+)
- [ ] Separate "Like" from "Import" (dedicated likes table)
- [ ] User profiles and deck collections
- [ ] Comments/reviews on decks
- [ ] Deck versioning/changelog
- [ ] Advanced search/filters in gallery

## Key Files Reference 📁

```
src/
├── routes/
│   ├── +page.svelte                      # Dashboard
│   ├── [slug]/+page.svelte              # Deck viewer (cleaned!)
│   └── next/gallery/+page.svelte        # Gallery page
├── lib/next/components/
│   ├── nav/
│   │   ├── DeckActions.svelte           # Unified action buttons
│   │   ├── MainHeader.svelte            # Header component
│   │   └── DeckMetadata.svelte          # Metadata display
│   └── dialogs/
│       ├── DeleteDeckDialog.svelte      # Delete confirmation
│       ├── PublishDeckDialog.svelte     # Publish workflow
│       └── MergeTool.svelte             # Conflict resolution
└── routes/api/
    ├── deck/[id]/+server.ts             # Fetch published deck
    └── decks/
        ├── publish/+server.ts           # Publish/update deck
        └── gallery/+server.ts           # Gallery listing
```

## Current Branch
`13-phase-1-public-gallery` (99 commits ahead of origin)

## Testing Checklist 🧪

Before Phase 1 launch:
- [ ] Create new deck → Publish → View in gallery → Import from different user
- [ ] Update published deck → Changes reflect in gallery
- [ ] Delete local deck → Verify it's gone
- [ ] Print deck (both Small and Big sizes)
- [ ] Like/Import count increments correctly
- [ ] Conflicts trigger MergeTool dialog
- [ ] Mobile responsiveness on all pages
- [ ] Error handling (network failures, invalid data)
- [ ] Token costs tracking for AI features

## Notes
- Import = Like for now (simple MVP)
- Print sizes: Small (poker) / Big (tarot)
- All dialogs use centralized Dialog system
- DeckActions handles all deck-level actions
- MergeTool for conflict resolution

---
*Last updated: 2025-11-20*
*Next session: Continue with gallery page testing and dashboard integration*
