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

## Game System Presets (In Progress) 🎲

### Foundation Complete ✅
- [x] **Database Schema**: Extended to support game presets with proper indexes
- [x] **Type System**: Added `GamePreset`, `MechanicDefinition`, and `CardMechanic` types  
- [x] **Official Presets**: Created 3 core game systems (Modern Fantasy, Classic Fantasy, Narrative RPG)
- [x] **Preset Store**: Complete Svelte store with CRUD operations and filtering
- [x] **GamePresetSelector**: UI component for browsing and selecting game systems
- [x] **Front/Back Philosophy**: Clear separation of player-visible vs GM-only information

### Next: Implementation 🚧
- [ ] **Preset Integration**: Add game preset selection to deck creation/editing
- [ ] **Card Mechanics Editor**: UI for editing back-card game mechanics
- [ ] **Preset Application**: Logic to apply presets to existing cards
- [ ] **Custom Preset Builder**: Advanced editor for creating custom game systems
- [ ] **Preset Sharing**: Import/export functionality for custom presets

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
