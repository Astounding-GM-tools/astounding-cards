# Character Cards Roadmap

## Current Phase: Core Functionality
- [x] Basic page layout and grid system
- [x] Double-sided printing support
- [x] Crop marks and printing guides
- [ ] Card front design implementation
  - [ ] Portrait/image area
  - [ ] Name and basic info layout
  - [ ] Key traits section
  - [ ] Printer-friendly text styles (outlined titles)
- [ ] Card back design implementation
  - [ ] Bio text area
  - [ ] Additional notes section
- [ ] Basic data handling
  - [ ] ContentEditable card fields
  - [ ] IndexedDB storage for local changes
  - [ ] URL parameter serialization/deserialization

## Next Phase: User Experience
- [ ] Character creation form
- [ ] Card preview functionality
- [ ] Print preview
- [ ] Image upload and cropping
- [ ] Print settings panel
  - [ ] Paper size selection
  - [ ] Margin adjustments
  - [ ] Crop mark toggles
  - [ ] Ink usage estimation
- [ ] Basic search and filtering

## Theme System
- [ ] Base theme implementation
  - [ ] Art Nouveau
  - [ ] Bauhaus
  - [ ] Medieval
  - [ ] Elfin
  - [ ] Cyberpunk
  - [ ] Corporate
  - [ ] Trading Card
  - [ ] Vintage Sports
- [ ] Theme customization
  - [ ] Color scheme editor
  - [ ] Typography selection
  - [ ] Border/frame styles
- [ ] Printer optimization
  - [ ] Ink-efficient designs
  - [ ] Outlined text for titles
  - [ ] Pattern density controls
  - [ ] Preview ink usage

## Content Management
- [ ] External Data Loading
  - [ ] JSON endpoint support
  - [ ] JSON schema validation
  - [ ] Meaningful error messages for invalid data
  - [ ] Sample endpoint templates
- [ ] Data Persistence
  - [ ] IndexedDB implementation
  - [ ] Auto-save edits
  - [ ] Conflict resolution for shared URLs
- [ ] Sharing
  - [ ] URL parameter encoding
  - [ ] URL compression for large datasets
  - [ ] Optional base64 image embedding
  - [ ] Shareable link generation
- [ ] Import/Export
  - [ ] Export current deck to JSON
  - [ ] Export as shareable URL
  - [ ] Batch character import

## Future Features
### Enhanced Content Features
- [ ] Template system
  - [ ] Define card layouts via JSON
  - [ ] Custom field configurations
  - [ ] Style variations
- [ ] Multiple decks support
- [ ] Deck categories/tags
- [ ] Search across all decks

### Enhanced Printing
- [ ] Multiple paper sizes
- [ ] Custom card sizes
- [ ] Alternative grid layouts
- [ ] Bleed area support
- [ ] Colored paper support
  - [ ] Theme adjustments for colored stock
  - [ ] Preview on different paper colors
  - [ ] Color compensation settings
- [ ] Print optimization features
  - [ ] Printer color profile support
  - [ ] Ink coverage analysis
  - [ ] Quality vs. ink usage settings
- [ ] QR codes linking to digital versions

### Mobile Support
- [ ] Responsive design
- [ ] Mobile-friendly character editing
- [ ] Digital character card viewing
- [ ] Share cards to mobile devices

## Technical Improvements
- [ ] Performance optimization
  - [ ] URL parameter compression
  - [ ] Image optimization
  - [ ] IndexedDB caching strategy
- [ ] Accessibility improvements
- [ ] JSON schema documentation
- [ ] Enhanced testing coverage
- [ ] Service Worker for offline support

## Nice-to-Have Features
- [ ] PDF export
- [ ] Integration examples
  - [ ] D&D Beyond API example
  - [ ] Roll20 character sheet import
  - [ ] Generic RPG tool JSON format
- [ ] Deck version history in IndexedDB
- [ ] AI-assisted character generation
- [ ] Custom font support
- [ ] Card back pattern generator
- [ ] Print quality preview
- [ ] Paper stock recommendations
  - [ ] Weight/thickness guide
  - [ ] Surface finish suggestions
  - [ ] Colored paper options

## Known Issues / Technical Debt
*(To be filled as we discover them)*

## Implementation Notes
### URL Parameter Strategy
- Consider URL compression for large datasets
- Implement graceful fallback for oversized URLs
- Structure parameters efficiently:
  ```
  ?deck=base64encoded-json
  ?endpoint=https://api.example.com/deck
  ?cards=[1,2,3...]&names=[...]&traits=[...]
  ```

### Data Flow
1. Check URL parameters first
2. Fall back to endpoint if specified
3. Load from IndexedDB if available
4. Merge remote data with local edits

### Printing Considerations
- Always optimize for minimal ink usage
- Avoid dark backgrounds and solid fills
- Use outlined text for titles and headers
- Consider printer margin variations
- Test with different paper stocks
- Provide paper recommendations

---
This roadmap is a living document and will be updated as we progress and gather user feedback. 