# Character Cards Roadmap

## Implementation Notes

### Store Update Pattern
To prevent scroll jumps and maintain performance:
- Use writable store for currentDeck (not derived)
- Update store directly with set() when saving changes
- Never force reloads by toggling currentDeckId
- Let keyed each-blocks handle partial updates
- This ensures only changed cards re-render and scroll position is maintained

### CSS Variables Pattern
For consistent styling and theming:
- Separate theme variables (affecting cards) from UI variables
- Use CSS variables for all colors, spacing, and typography
- Keep UI styling consistent regardless of theme
- Use container queries for responsive sizing
- Maintain print-friendly styles

### Theme Component Pattern
For consistent theme application:
- Use regular elements for interactive/conditional decorations
- Use pseudo-elements for static decorations
- Maintain clear z-index layering
- Support both light and dark versions of decorations
- Keep flourishes and decorations accessible and print-friendly

## Architecture Refactor

- [x] **Canon Update Pattern Implementation**
  - [x] Implemented unified update system with atomic database-first operations
  - [x] All components now use consistent `canonUpdateCard`/`canonUpdateDeck` functions
  - [x] Replaced optimistic updates with loading states for better UX
  - [x] Centralized error handling with toast notifications
- [x] **Comprehensive Cleanup**
  - [x] Removed obsolete `deckContext.ts` and `debounce.ts`
  - [x] Removed unused `updateCardProperty()` from `db.ts`
  - [x] Cleaned up backward compatibility type aliases
  - [x] Removed unused imports and empty callback props
- [x] **Documentation Overhaul**
  - [x] Created detailed `CANON_UPDATE_PATTERN.md`
  - [x] Updated `ARCHITECTURE.md` to reflect new patterns
  - [x] Rewrote `README.md` to be user-focused and reference live deployment

## Next Steps (Pre-Deployment)

### 1. Final Fixes & Polish

- [ ] **Crop Marks & Card Positioning**
  - [ ] Re-implement crop marks for front cards
  - [ ] Ensure consistent crop mark visibility on all cards
  - [ ] Optimize card margins and padding for print layouts
- [ ] **Deck Creation Flow**
  - [ ] Add "Create New Deck" button to deck management
  - [ ] Implement deck creation logic
  - [ ] Update deck list after creation
  - [ ] Switch to new deck automatically
- [ ] **Final Testing**
  - [ ] Fix any remaining TypeScript/linting warnings
  - [ ] Test card title synchronization
  - [ ] Test card type selection and updates
  - [ ] Test location linking functionality
  - [ ] Test edge cases (empty values, long content)

### 2. PWA & Offline Support

- [ ] Configure `vite-plugin-pwa` for SvelteKit
- [ ] Create `manifest.json` and icons
- [ ] Implement service worker for offline caching
- [ ] Test offline functionality thoroughly
- [ ] Ensure seamless updates when new versions are deployed

## Post-Deployment Roadmap

- **Export/Import System**: Implement JSON and zip export/import
- **Deck Merge System**: Advanced diffing and merging for shared decks
- **Service Card**: QR code card for easy sharing
- **Game System Integration**: Templates and validation for specific TTRPGs
- **Commercial Features**: Image hosting, team features, and more
