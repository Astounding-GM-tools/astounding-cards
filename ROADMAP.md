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

## Next Steps (Priority Order)

### 1. Theme Implementation
- [x] Basic theme structure and variables
  - [x] Core color variables
  - [x] Typography settings
  - [x] Spacing and layout
  - [x] Print optimizations
- [x] Initial decorative elements
  - [x] Corner flourishes with light/dark variants
  - [x] Centered title with proper spacing
  - [x] Content box styling
  - [x] Proper z-index layering
- [ ] Theme System Cleanup
  - [x] Standardize CSS variable inheritance
  - [x] Remove redundant variable declarations
  - [x] Ensure print-friendly values (no opacity/effects)
  - [x] Fix flourish opacity inheritance system
  - [x] Document theme creation guidelines
  - [ ] Create theme template with comments
- [ ] Active Theme Development
  - [ ] Improve Cordial theme (disabled flourishes until better design)
  - [ ] Refine Classic theme (minimal, clean design)
  - [ ] Polish Scriptorum theme (manuscript style)
  - [ ] Enhance Cyberdeck theme (tech aesthetic)
  - [ ] Add theme descriptions to selector
- [ ] Postponed Themes (v2)
  - [ ] Modern theme (removed, needs redesign)
  - [ ] Vintage theme (removed, needs redesign)
  - [ ] Keegan theme (vintage trading card style)
  - [ ] Western theme "Drifters" (wanted posters & playing cards)
  - [ ] Contemporary/Corporate theme
  - [ ] Nature theme
- [ ] Theme-specific features
  - [ ] Add theme-specific corner flourish designs
  - [ ] Implement divider styles per theme
  - [ ] Add optional texture overlays
  - [ ] Create theme-specific frames
  - [ ] Add theme-specific typography pairings
- [ ] Theme System Optimization
  - [ ] Optimize font loading (load only fonts used by active themes)
  - [ ] Create theme asset sprite system
  - [ ] Add theme-specific print optimizations
  - [ ] Implement theme switching without page reload

### Tomorrow's Focus
1. Active Theme Polish
   - Improve Cordial theme design (new flourishes)
   - Refine Classic theme minimalism
   - Enhance Scriptorum manuscript features
   - Polish Cyberdeck tech aesthetic
2. Theme Documentation
   - [x] Update theme development guide
   - [x] Document CSS variable system
   - [ ] Add theme template with examples
3. Theme UI Improvements
   - Add theme descriptions to selector
   - Improve theme switching UX
   - Show current theme name clearly

### 2. Import & Export System
- [ ] URL Sharing
  - [x] Add "Copy URL" button
  - [x] Clear URL after import
  - [ ] Add URL validation
  - [ ] Show URL size indicator
  - [ ] Add sharing instructions
  - [ ] Handle URL import conflicts
  - [ ] Add version tracking for shared decks
- [ ] Direct JSON Import/Export
  - [ ] Add JSON paste field with validation
  - [ ] Export deck as formatted JSON
  - [ ] Clear error messages for invalid JSON
  - [ ] Preview before import
  - [ ] Merge options (new deck/existing deck)
- [ ] API Integration
  - [ ] Support for endpoint URLs
  - [ ] Authentication options (headers, tokens)
  - [ ] Rate limiting and error handling
  - [ ] Progress indicators
  - [ ] Webhook support for external updates
- [ ] Import Mapping
  - [ ] Define mapping templates
  - [ ] Custom field mapping UI
  - [ ] Save/load mapping presets
  - [ ] Handle nested data structures
- [ ] AI Integration Documentation
  - [ ] Clear JSON schema documentation
  - [ ] Example prompts for different LLMs
  - [ ] Structured data extraction guides
  - [ ] Best practices for card generation
  - [ ] Image suggestion strategies
- [ ] Collaboration Features
  - [ ] Self-sync across devices
    - [ ] Clear "last synced" indicator
    - [ ] Quick device-to-device sharing
    - [ ] Optional auto-sync via URL
  - [ ] Author/Resource sharing
    - [ ] Mark decks as "official" or "modified"
    - [ ] Track source/parent deck
    - [ ] Support for errata updates
    - [ ] Fork/variant handling
  - [ ] Conflict Resolution
    - [ ] Compare versions
    - [ ] Show visual diffs
    - [ ] Merge options
    - [ ] Keep history
- [ ] Example Integrations
  - [ ] Adventure conversion examples
  - [ ] NPC roster imports
  - [ ] Location gazetteer imports
  - [ ] Item catalog imports
  - [ ] Integration guides for common systems

### 3. Mobile Experience
- [ ] Create dedicated mobile routes and views
  - [ ] Separate from print layout components
  - [ ] Mobile-first navigation pattern
  - [ ] Touch-friendly editing interface
- [ ] Mobile-optimized deck management
  - [ ] Card list view with quick actions
  - [ ] Swipe gestures for navigation
  - [ ] Bottom sheet for quick edits
  - [ ] Pull-to-refresh for updates
- [ ] Card editing experience
  - [ ] Full-screen card editor
  - [ ] Simplified trait management
  - [ ] Easy image URL input
  - [ ] Quick-access formatting tools
- [ ] Mobile-specific features
  - [ ] Portrait/landscape optimization
  - [ ] Offline indicators
  - [ ] Share sheet integration
  - [ ] Camera integration for portraits

### 4. Image Handling
- [ ] Change from local /portraits/ to full URLs
- [ ] Add image URL validation
- [ ] Add hosting suggestions:
  - [ ] Imgur integration with size optimization
    - [ ] Direct URL support
    - [ ] Image picker component
    - [ ] Automatic size selection
    - [ ] Content moderation benefits
  - [ ] Support for other sources (Midjourney, etc.)
- [ ] Progressive image loading
  - [ ] BlurHash implementation for beautiful loading states
  - [ ] Support for modern formats (AVIF, WebP)
  - [ ] JPEG XL investigation when browser support improves
- [ ] Add guidance for:
  - [ ] Recommended image sizes
  - [ ] Supported formats
  - [ ] Hosting considerations
  - [ ] CORS requirements

### 5. PWA & Offline Support
- [ ] Basic PWA setup
  - [ ] Web manifest
  - [ ] Service worker registration
  - [ ] Install prompts
  - [ ] App icons and splash screens
- [ ] Smart caching strategy
  - [ ] Version manifest file for quick checks
  - [ ] Cache static assets (JS/CSS/images)
  - [ ] Cache app shell for offline startup
  - [ ] Conditional cache busting based on version
- [ ] Network handling
  - [ ] Offline-first approach
  - [ ] Background sync for changes
  - [ ] Network status indicators
  - [ ] Graceful degradation 