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

## Next Steps (Priority Order)

### 1. Print Layout Polish
- [ ] Add page navigation/preview
- [ ] Show sheet numbers and card positions
- [ ] Add visual page breaks in edit mode
- [ ] Test with different paper sizes
- [ ] Improve print preview mode
- [ ] Add print instructions
- [ ] Handle printer margins better

### 2. Theme Implementation
- [ ] Apply theme styles to cards
  - [ ] Implement theme CSS application
  - [ ] Create theme assets (patterns, borders)
  - [ ] Test all themes
  - [ ] Add theme previews in selector
  - [ ] Ensure print compatibility
  - [ ] Add theme customization options

### 3. URL Sharing Improvements
- [x] Add "Copy URL" button
- [x] Clear URL after import
- [ ] Add URL validation
- [ ] Show URL size indicator
- [ ] Add sharing instructions
- [ ] Handle URL import conflicts
- [ ] Add version tracking for shared decks

### 4. Advanced URL Sharing & Collaboration
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

### 5. Mobile Experience
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

### 6. Image Handling
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

### 7. PWA & Offline Support
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