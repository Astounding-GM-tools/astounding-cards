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

### Next Steps (Priority Order)

### 1. Image Handling
- [ ] URL-based Images
  - [ ] URL validation and testing
  - [ ] Support for common image hosts
  - [ ] Clear user guidance
  - [ ] Error handling and fallbacks
- [ ] Local File Support
  - [ ] Relative path handling
  - [ ] Size and format validation
  - [ ] Print quality warnings
  - [ ] Migration path to URLs
- [ ] Image Processing
  - [x] Proper card dimensions
  - [x] Format optimization
  - [x] Print-friendly processing
  - [x] Size validation
- [ ] Documentation
  - [ ] Recommended image hosts
  - [ ] Size/format guidelines
  - [ ] Best practices for sharing
  - [ ] Troubleshooting guide

### 2. Import & Export System
- [ ] URL Sharing
  - [x] Add "Copy URL" button
  - [x] Clear URL after import
  - [ ] Add URL validation
  - [ ] Show URL size indicator
  - [ ] Add sharing instructions
  - [ ] Handle URL import conflicts
  - [ ] Add version tracking for shared decks
- [ ] JSON Import/Export
  - [ ] Add JSON paste field with validation
  - [ ] Export deck as formatted JSON
  - [ ] Clear error messages for invalid JSON
  - [ ] Preview before import
  - [ ] Merge options (new deck/existing deck)
  - [ ] Optional: Include images as base64

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