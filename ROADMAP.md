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

## Next Steps (Priority Order)

### 1. Layout Improvements
- [ ] Fix back card positioning for any number of cards (1-32)
  - [ ] Remove artificial 9-card limit
  - [ ] Support multiple sheets (up to 4 double-sided pages)
  - [ ] Add page navigation/preview
  - [ ] Show sheet numbers and card positions
  - [ ] Maintain proper double-sided printing alignment
  - [ ] Test with different card counts
  - [ ] Handle gaps in grid gracefully
  - [ ] Add visual page breaks in edit mode

### 2. Mobile Experience
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

### 3. URL Sharing & Collaboration
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

### 4. Image Handling
- [ ] Change from local /portraits/ to full URLs
- [ ] Add image URL validation
- [ ] Add hosting suggestions:
  - [ ] Imgur
  - [ ] ImgBB
  - [ ] Postimages
  - [ ] Other free options
- [ ] Add guidance for:
  - [ ] Recommended image sizes
  - [ ] Supported formats
  - [ ] Hosting considerations

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

## Future Features
- [ ] Theme switching for different card styles
- [ ] Export/Import functionality for decks
- [ ] Support for different card sizes and paper formats:
  - [ ] Tarot size cards (3 per A4/Letter)
  - [ ] A5 format support
  - [ ] US Letter format support
  - [ ] US Legal format support
  - [ ] Larger text options for improved readability
  - [ ] Adjustable margins for different printers
  - [ ] Custom crop mark positions for different sizes
- [ ] Real-time Collaboration Features
  - [ ] Server infrastructure for real-time sync
  - [ ] Selective card sharing (GM to players)
  - [ ] Permission levels (view/edit/admin)
  - [ ] Player note layers
  - [ ] Progressive card reveals
  - [ ] Support for "Murder Wall" scenarios
    - [ ] Player-added connections
    - [ ] Shared notes and theories
    - [ ] GM-only information layer
  - [ ] Session management
    - [ ] Temporary sharing during play
    - [ ] Auto-cleanup after session
    - [ ] Session history/notes 