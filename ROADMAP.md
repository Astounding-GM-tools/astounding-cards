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
  - [x] Notes section for handwritten notes (intentionally non-editable for pencil notes)
- [x] Basic data handling
  - [x] ContentEditable card fields
  - [x] IndexedDB storage for local changes
  - [x] URL parameter serialization/deserialization
  - [x] Auto-save functionality
  - [x] Debounced input handling

## Next Steps (Priority Order)

### 1. Deck Management
- [ ] Switch to UUID v4 for deck and character IDs
  - [ ] Update schema and types
  - [ ] Add UUID generation on creation
  - [ ] Ensure URL-safe encoding
- [ ] Add lastEdited timestamp for decks
  - [ ] Use for deck sorting and conflict resolution
  - [ ] Show "last modified" in deck list
- [ ] Add deck selector dropdown in header
- [ ] List decks from IndexedDB
- [ ] Auto-load most recently edited deck
- [ ] Show current deck name
- [ ] Consider deck deletion/archiving
- [ ] Add character management
  - [ ] Copy characters (with new UUIDs)
  - [ ] Delete characters

### 2. Layout Improvements
- [ ] Fix back card positioning for any number of cards (1-32)
  - [ ] Remove artificial 9-card limit
  - [ ] Support multiple sheets (up to 4 double-sided pages)
  - [ ] Add page navigation/preview
  - [ ] Show sheet numbers and card positions
  - [ ] Maintain proper double-sided printing alignment
  - [ ] Test with different card counts
  - [ ] Add URL size monitoring
    - [ ] Calculate and display current URL size
    - [ ] Warn when approaching browser limits (~32k chars)
    - [ ] Disable new character creation near limit
    - [ ] Suggest creating new deck when limit reached
  - [ ] Handle gaps in grid gracefully
  - [ ] Add visual page breaks in edit mode

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
- [ ] Progressive enhancement
  - [ ] Basic functionality without JS
  - [ ] Enhanced features with modern APIs
  - [ ] Fallbacks for older devices

### 4. URL Sharing & Collaboration
- [ ] Use UUIDs for distributed collaboration
- [ ] Handle URL vs local data conflicts
  - [ ] Compare lastEdited timestamps
  - [ ] Show simple diff view of changes
  - [ ] Let user choose which version to keep
  - [ ] Option to keep both (duplicate deck)
- [ ] Auto-update URL as changes are made
  - [ ] Debounce URL updates
  - [ ] Show URL update status
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

### 5. Image Handling
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

## Future Features
- [ ] Theme switching for different card styles
- [ ] Export/Import functionality for decks
- [ ] Visual indicator for card positions (front/back matching)
- [ ] Add "Add Character" placeholder card when < 9 cards
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

## Implementation Notes

### URL Parameter Strategy
- No compression needed - keep data minimal
- Images referenced by URL only, not embedded
- Pure client-side sharing via URLs
- No server endpoints needed
- URLs serve as "commits" or "snapshots"
- Sharing happens through normal URL sharing

### Data Flow
1. Check URL parameters first
2. Load from IndexedDB if available
3. Create new deck if neither exists
4. Auto-save changes to IndexedDB
5. Update URL for sharing (optional)
6. Handle conflicts between URL and local data
  - Compare lastEdited timestamps
  - Show simple diff view
  - Let user pick version or keep both
  - Save choice to IndexedDB

### Printing Considerations
- Maintain proper front/back alignment
- Handle any number of cards (1-32)
- Keep notes section empty for handwriting
- Ensure crop marks work correctly
- Print mode hides all UI elements
- Support both automatic and manual double-sided printing:
  - Organize pages as alternating fronts/backs for duplex printers
  - For manual printing:
    - Print odd pages first (all card fronts)
    - Print even pages second (all card backs)
    - Clear instructions for paper reloading
  - Support single-sided printing for DIY card assembly:
    - Print all pages single-sided
    - Clear instructions for gluing onto cardstock/playing cards
    - Maintain crop marks for easy cutting
  - Maintain consistent card ordering across all pages
  - Add page numbers and front/back indicators
  - Show preview of print layout before printing
  - Add test page option for alignment verification
  - Include paper handling recommendations:
    - Paper orientation guide
    - Margin settings
    - Recommended paper weights
    - Paper reloading instructions per printer type

### Deployment
- GitHub Pages (preferred option):
  - Completely free
  - Built into GitHub
  - Just needs:
    - @sveltejs/adapter-static
    - SPA mode configuration
    - Simple 404.html redirect for client routing
    - GitHub Actions for automated builds
  - No usage limits
- Alternative options:
  - Vercel free tier (native SvelteKit support)
  - Deno Deploy (excellent for SvelteKit, great performance)
  - Netlify (similar benefits to Vercel)
  - Cloudflare Pages
  - Any static hosting that can handle SPA routing

### PWA & Offline Support
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
- [ ] Performance optimizations
  - [ ] Asset preloading
  - [ ] Code splitting
  - [ ] Lazy loading of non-critical resources
  - [ ] Image optimization pipeline

### Technical Decisions
- Using IndexedDB for local storage only
- No server-side components needed (enables static hosting)
- URL sharing as primary collaboration mechanism
- Keeping image data separate from deck data
- Debounced saves and updates
- ContentEditable for direct card editing
- Multi-sheet support:
  - Target up to 32 characters (4 double-sided sheets)
  - Monitor URL size (Chrome limit ~32-80k chars)
  - Graceful degradation when approaching limits
  - Sheet-based navigation in edit mode
  - Clear page breaks for printing
- Data structure ready for future expansion:
  - UUIDs enable future server sync
  - Separate character storage supports selective sharing
  - Metadata fields allow for permission tracking
  - Notes field can support multiple layers
- PWA and caching architecture:
  - Version manifest for quick update checks
  - Static assets cached with version tags
  - App shell cached separately
  - IndexedDB for deck data
  - Service worker controls network strategy
- Mobile architecture:
  - Separate routes for print/mobile views
  - Shared data layer and types
  - Component specialization by context
  - Mobile-specific state management
  - Touch event handling layer
  - Responsive image loading strategy

---
This roadmap is a living document and will be updated as we progress and gather user feedback. 