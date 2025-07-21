# Character Cards Roadmap

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
  - [x] Bio text area
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
- [x] Print Layout Polish
  - [x] Add print instructions modal
  - [x] Document printer margin handling
  - [x] Maintain proper page breaks
  - [x] Paper size agnostic layout
  - [x] Consistent 4mm printer margins
  - [x] Proper grid proportions (5:7)
  - [x] US Letter/Legal adaptations
  - [x] Centered grid with proper spacing

## Next Steps (Priority Order)

### 1. Theme Implementation
- [ ] Apply theme styles to cards
  - [ ] Implement theme CSS application
  - [ ] Create theme assets (patterns, borders)
  - [ ] Test all themes
  - [ ] Add theme previews in selector
  - [ ] Ensure print compatibility
  - [ ] Add theme customization options

### 2. Card Size Options
- [x] Add size toggle in deck settings
  - [x] Poker size (3x3 grid, 9 cards per page)
  - [x] Tarot size (2x2 grid, 4 cards per page)
- [x] Implement responsive scaling
  - [x] Grid layout adaptation
  - [x] Automatic content scaling
  - [x] Print layout adjustments
- [x] Update print instructions for both sizes

### 3. Expanded Card Types
- [ ] Add card type selector
  - [ ] Characters (NPCs, allies, adversaries)
  - [ ] Items (weapons, artifacts, books)
  - [ ] Locations (taverns, dungeons, shops)
  - [ ] Handouts (letters, maps, clues)
- [ ] Front card (observable information)
  - [ ] Type-specific templates
  - [ ] Apparent traits (age, appearance, etc.)
  - [ ] Observable features
  - [ ] Public knowledge/rumors
  - [ ] Clean layout for player handouts
- [ ] Back card (GM information)
  - [ ] Game stats (HP, AC, etc.)
  - [ ] Hidden information
  - [ ] Plot hooks and secrets
  - [ ] GM notes section
  - [ ] Prints blank for player handouts
- [ ] Template suggestions by type
  - [ ] Common attributes for each type
  - [ ] Flexible attribute system
  - [ ] Editable keys and values
  - [ ] Optional attributes

### 4. URL Sharing Improvements
- [x] Add "Copy URL" button
- [x] Clear URL after import
- [ ] Add URL validation
- [ ] Show URL size indicator
- [ ] Add sharing instructions
- [ ] Handle URL import conflicts
- [ ] Add version tracking for shared decks

### 5. Advanced URL Sharing & Collaboration
- [ ] Support different collaboration modes:
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

### 6. Mobile Experience
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

### 7. Image Handling
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

### 8. PWA & Offline Support
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