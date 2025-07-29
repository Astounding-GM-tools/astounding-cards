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

## Current Progress
- [x] Basic page layout and grid system
- [x] Double-sided printing support
- [x] Crop marks and printing guides
- [x] Card front design implementation
  - [x] Portrait/image area
  - [x] Name and basic info layout
  - [x] Key traits section
  - [x] Printer-friendly text styles
- [x] Card back design implementation
  - [x] Description text area
  - [x] Notes section for handwritten notes
- [x] Basic data handling
  - [x] ContentEditable card fields
  - [x] IndexedDB storage for local changes
  - [x] URL parameter serialization/deserialization
  - [x] Auto-save functionality
  - [x] Debounced input handling
- [x] Deck Management
  - [x] Switch to UUID v4 for deck and character IDs
  - [x] Add timestamps for sorting and conflict resolution
  - [x] Add deck selector dropdown in header
  - [x] List decks from IndexedDB
  - [x] Auto-load most recently edited deck
  - [x] Show current deck name
  - [x] Basic deck deletion with confirmation
  - [x] URL size monitoring and warnings
  - [x] Character deletion and copying
  - [x] Theme selection UI with preview
- [x] User Feedback System
  - [x] Toast notification component
  - [x] Success/info/warning/error states
  - [x] Automatic dismissal
  - [x] Consistent styling
  - [x] Accessible notifications
- [x] Layout Improvements
  - [x] Fix back card positioning for any number of cards (1-32)
  - [x] Remove artificial 9-card limit
  - [x] Support multiple sheets (up to 4 double-sided pages)
  - [x] Maintain proper double-sided printing alignment
  - [x] Handle gaps in grid gracefully
  - [x] Proper RTL/LTR handling for back cards
  - [x] Maintain scroll position during edits
  - [x] Optimize re-renders and updates
  - [x] Consistent font sizing with container queries
  - [x] Proper label formatting and alignment
- [x] Print Layout Polish
  - [x] Add print instructions modal
  - [x] Document printer margin handling
  - [x] Maintain proper page breaks
  - [x] Paper size agnostic layout
  - [x] Consistent 4mm printer margins
  - [x] Proper grid proportions (5:7)
  - [x] US Letter/Legal adaptations
  - [x] Centered grid with proper spacing
- [x] Accessibility Improvements
  - [x] Proper ARIA roles for notifications
  - [x] Keyboard navigation support
  - [x] Semantic HTML structure
  - [x] Consistent focus states
  - [x] Screen reader friendly content
- [x] Terminology Refactoring
  - [x] Rename "Character" to "Card" throughout codebase
  - [x] Update component names and files
  - [x] Update store functionality
  - [x] Update database schema
  - [x] Update UI text and labels
  - [x] Update sample data
  - [x] Update image handling terminology
  - [x] Remove backward compatibility exports
  - [x] Update documentation
- [x] CSS and Theme System Improvements
  - [x] Standardize font size units (px based on 1rem = 16px)
  - [x] Fix @property declarations and initial values
  - [x] Add --desc-font-size variable
  - [x] Add --body-line-height variable
  - [x] Fix theme-specific font sizes
  - [x] Restore base flourish styling
  - [x] Fix Scriptorum theme font sizes
  - [x] Fix Type button font size
  - [x] Fix corner flourish styling

### Next Steps (Priority Order)

1. **Fix CardStatSelector Component**
   - Debug why type selection only works for first card
   - Investigate component mounting/unmounting
   - Check effect dependency tracking
   - Verify state initialization timing
   - Test state reset between cards
   - Review parent component integration

2. **Deck Creation**
   - Add "Create New Deck" button to deck management
   - Implement proper deck creation flow
   - Handle database operations correctly
   - Add success/error feedback
   - Update deck list after creation
   - Switch to new deck automatically

3. **Export Implementation**
   - Implement JSON export with proper image URL handling
   - Add .zip backup export with blob data
   - Add progress tracking for large exports
   - Create restore/import functionality

4. **Deck Merge System**
   - Create merge detection (same deck ID)
   - Build diff viewer UI
     - Show added/removed/modified characters
     - Show changes in deck metadata
     - Highlight specific field changes
   - Implement merge strategies
     - Accept all changes (overwrite)
     - Create new deck (new UUID)
     - Selective merge (pick changes)
   - Handle special cases
     - Image conflicts (URL vs blob)
     - Character order changes
     - Theme/style changes
   - Add conflict resolution UI
     - Side-by-side comparison
     - Change preview
     - Batch operations

5. **Service Card**
   - Design the card layout
   - Add QR code generation
   - Implement auto-insertion
   - Make it non-deletable

6. **Documentation**
   - Write IMAGE_HOSTING.md
   - Update USAGE.md with new features
   - Add examples and screenshots
   - Document merge functionality
     - Explain merge strategies
     - Show conflict resolution
     - Provide best practices

7. **Polish & Testing**
   - Test sharing with large decks
   - Test image migration edge cases
   - Test merge scenarios
     - Complex character changes
     - Image format conflicts
     - Partial updates
   - Add more user feedback
   - Improve error handling

### Future Considerations
- Consider adding image optimization options
- Add batch URL validation
- Support more image hosting services
- Add deck versioning for shared URLs
- Add merge history tracking
- Support branch/variant management
- Add collaborative editing features

### 3. Import System
- [ ] URL Import
  - [ ] Validate incoming URLs
  - [ ] Handle oversized decks
  - [ ] Merge options
- [ ] File Import
  - [ ] JSON validation
  - [ ] Archive extraction
  - [ ] Progress tracking
  - [ ] Error recovery
- [ ] Import UI
  - [ ] Add to deck management
  - [ ] Preview before import
  - [ ] Conflict resolution
  - [ ] Success/error feedback

### Future Development (v2)
- [ ] Commercial Features
  - [ ] Integrated image hosting
  - [ ] Batch upload support
  - [ ] Image management
  - [ ] Higher size limits
  - [ ] CDN integration
  - [ ] User galleries
- [ ] Subscription System
  - [ ] Payment processing
  - [ ] Usage tracking
  - [ ] Account management
  - [ ] Team/organization support
- [ ] Repository System
  - [ ] Public deck repository
  - [ ] User galleries
  - [ ] Deck discovery
  - [ ] Rating/comments 

## Technical Debt and Cleanup

### CSS Variable Consolidation
Currently, theme-related CSS variables are scattered across multiple locations:
1. `src/lib/themes/styles/properties.css`: Theme-specific `@property` declarations
2. `src/lib/styles/variables.css`: Some theme-related variables mixed with UI variables
3. `src/lib/themes.ts`: Theme color definitions and other theme properties

This creates several issues:
- Potential inconsistencies between TypeScript theme definitions and CSS variables
- Duplicate or conflicting values across files
- Unclear separation between UI variables and theme variables
- Some variables have been renamed or removed but might still exist in other files

Plan for consolidation:
1. Audit all theme-related variables across files
2. Create clear separation:
   - Theme-specific `@property` declarations in `properties.css`
   - UI and layout variables in `variables.css`
   - Theme definitions only in `themes.ts`
3. Remove deprecated variables
4. Ensure consistent naming between TS types and CSS properties
5. Document the relationship between theme TypeScript types and CSS properties

Impact: Medium - requires careful testing of all themes and UI components to ensure no styling regressions. 