# Card Deck Creator Architecture

## Overview

Card Deck Creator is a **client-side only** application built with SvelteKit. It runs entirely in the browser with no server-side dependencies, making it easy to deploy to any static hosting service.

## Key Design Decisions

### 1. Client-Side Only
- All data is stored in the browser using IndexedDB
- No server-side API or database required
- Sharing via URL serialization
- Images stored as blobs in IndexedDB

### 2. Data Persistence
- IndexedDB for local storage
  - `decks` object store with `id` as key path
  - Stores complete deck objects including cards and metadata
- Auto-saving with debounce (1 second delay)
- URL-based state sharing for deck distribution

### 3. State Management
- Svelte stores for reactive state
- Optimized store update pattern to prevent scroll jumps
- Direct store updates with proper validation
- Toast notifications for user feedback

### 4. Component Structure
- Card components (Front/Back) for display
- Deck management components
- Theme selection and customization
- Print layout optimization
- Image handling and processing

## Data Flow

1. **Deck Creation/Loading**
   ```
   User Action → Store Update → IndexedDB Save → UI Update
   ```

2. **Card Editing**
   ```
   Edit Event → Debounced Save → Store Update → IndexedDB Save
   ```

3. **Deck Sharing**
   ```
   Share Action → Deck Serialization → URL Generation → Clipboard
   ```

4. **Deck Import**
   ```
   URL Parse → Data Validation → Store Update → IndexedDB Save
   ```

## Key Files and Directories

- `/src/lib/stores/deck.ts` - Core data management
- `/src/lib/components/` - UI components
- `/src/lib/types.ts` - TypeScript definitions
- `/src/lib/themes/` - Theme definitions and styles

## Development Guidelines

1. **Data Persistence**
   - Always use IndexedDB for storage
   - Implement proper error handling
   - Validate data before saving
   - Use debounced saves for performance

2. **State Management**
   - Follow the store update pattern
   - Avoid unnecessary re-renders
   - Maintain scroll position
   - Handle errors gracefully

3. **UI Components**
   - Keep components focused
   - Use proper TypeScript types
   - Follow accessibility guidelines
   - Support print layout

4. **Performance**
   - Optimize image handling
   - Use proper caching
   - Implement lazy loading
   - Monitor URL size limits

## Deployment

The application can be deployed to any static hosting service:
- No special server requirements
- No database setup needed
- No environment variables required
- No API dependencies

## Future Considerations

1. **Data Export**
   - JSON export with image URLs
   - Zip backup with blob data
   - Progress tracking
   - Import functionality

2. **Offline Support**
   - Service worker implementation
   - Offline-first architecture
   - Sync management
   - Conflict resolution

3. **Performance Optimization**
   - Image optimization options
   - Batch operations
   - Improved caching
   - Load time optimization 