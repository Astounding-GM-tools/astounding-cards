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
- [x] **Deck Management System**
  - [x] Implemented unified "Manage Cards" dialog with expandable card previews.
  - [x] Added Canon Update pattern for card deletion with proper loading states.
  - [x] Enhanced UI with summary/detail card previews and visual expand indicators.
  - [x] Fixed deck duplication, deletion, and list synchronization issues.
  - [x] Implemented "Copy Cards" functionality with a dialog to select a target deck or create a new one.
  - [x] Integrated copy operation with the Canon Update pattern for consistent UI feedback.
  - [x] Fixed image copying and deck list refresh issues when copying to a new deck.
- [x] **Vocabulary Customization System**
  - [x] Replaced complex statblock configuration selector with intuitive vocabulary editor
  - [x] Implemented simple vocabulary customization for RPG stat names (Health → Hit Points, etc.)
  - [x] Added vocabulary-aware template system with live previews
  - [x] Enhanced template dialog to show customized names before applying
  - [x] Created utility functions for converting between vocabulary formats
  - [x] Maintained backward compatibility with existing decks

## Next Steps (Pre-Deployment)

### 1. Component Architecture

- [ ] **Card/CardBase Refactor**
  - [ ] Combine CardBase and CardFront into a single component
  - [ ] Simplify preview modes and theme previews
  - [ ] Standardize preview sizing across all contexts (deck manager, theme selector, etc.)
  - [ ] Reduce prop passing complexity and improve maintainability

### 2. Final Fixes & Polish

- [x] **Complete Card Management Operations**
  - [x] Implement "Change Theme" for selected cards.
  - [x] Fix `DataCloneError` when duplicating a deck.
  - [x] Removed "Move Cards" (redundant - users can copy to current deck instead).

- [ ] **Card Sizing & Typography Overhaul**
  - [ ] Fix container query (cqw) font sizing issues - cards should look identical across sizes
  - [ ] Ensure Poker and Tarot cards are visually identical, just scaled (Poker = smaller/harder to read)
  - [ ] Overhaul theme font size system - limit to semantic keywords (smaller, larger, etc.)
  - [ ] Remove absolute font sizes from themes to prevent sizing conflicts across card dimensions
  - [ ] Implement proper fluid typography that scales consistently with card size

- [ ] **Crop Marks & Card Positioning**
  - [ ] Re-implement crop marks for front cards
  - [ ] Ensure consistent crop mark visibility on all cards
  - [ ] Optimize card margins and padding for print layouts
- [x] **Deck Creation Flow**
  - [x] Add "Create New Deck" button to deck management
  - [x] Implement deck creation logic
  - [x] Update deck list after creation
  - [x] Switch to new deck automatically
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

## Game System Support ✅

### Vocabulary Customization System (Complete)

- [x] **Database Schema**: Extended to support statblock configurations with proper indexes
- [x] **Type System**: Added `StatblockConfig`, `StatblockVocabulary`, and enhanced `CardMechanic` types
- [x] **Official Configurations**: Created multiple RPG system vocabularies (Modern RPG, OSR, Narrative, Investigation)
- [x] **Configuration Store**: Complete Svelte store with CRUD operations for vocabulary management
- [x] **Vocabulary Editor**: Intuitive UI component for customizing stat names per deck
- [x] **Template Integration**: Smart templates that adapt to custom vocabularies with live previews
- [x] **Front/Back Philosophy**: Clear separation of player-visible vs GM-only information

### Evolution from Complex to Simple

The vocabulary customization system evolved from initial game preset work, focusing on the most important need:
**customizable terminology**. Instead of complex preset selection, users get an intuitive vocabulary editor
that lets them adapt any RPG system (D&D → "Hit Points", PbtA → "Stress", etc.) while maintaining
all the power of contextual templates and structured data.

### Front/Back Card Design Philosophy 📋

**Front Card (Player-Visible)**:

- Public character information (age, heritage, clan, profession)
- Item properties (value, rarity, weight, material)
- Location details (area, population, climate)
- Spell/ability basics (level, school, duration, range)

**Back Card (GM-Only)**:

- Combat mechanics (HP, AC, attack bonuses, damage)
- Saving throws and resistances
- Special abilities and game mechanics
- Morale, initiative, and tactical information

This allows single-sided printing for player handouts while keeping GM information private on the back.

## Post-Deployment Roadmap

- **Export/Import System**: Implement JSON and zip export/import
- **Deck Merge System**: Advanced diffing and merging for shared decks
- **Service Card**: QR code card for easy sharing
- **Advanced Game Systems**: Support for more complex RPG mechanics
- **Commercial Features**: Image hosting, team features, and more
