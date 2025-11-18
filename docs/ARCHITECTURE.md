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
- Atomic database-first updates (Canon Update pattern)
- URL-based state sharing for deck distribution

### 3. State Management

- Svelte 5 runes mode (`$state`, `$derived`, `$effect`) for reactive state
- **Canon Update Pattern** (see [CANON_UPDATE_PATTERN.md](./CANON_UPDATE_PATTERN.md) for detailed documentation):
  - Database-first atomic updates
  - Granular loading states for user feedback
  - Centralized update logic in `src/lib/next/stores/deckStore.svelte.ts`
  - No optimistic updates - UI reflects persisted state only
- Toast notifications for user feedback
- Optimized to prevent scroll jumps and unnecessary re-renders

### 4. Component Structure

- Card components (Front/Back) for display
- Deck management components
- Theme selection and customization
- Print layout optimization
- Image handling and processing

## Data Flow

1. **Deck Creation/Loading**

   ```
   User Action → IndexedDB Save → Store Update → UI Update
   ```

2. **Card Editing (Canon Update Pattern)**

   ```
   Edit Event → Loading State → IndexedDB Save → Store Update → UI Update
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

- `/src/lib/next/stores/deckStore.svelte.ts` - Core deck state management (Canon Update pattern)
- `/src/lib/next/stores/database.ts` - IndexedDB wrapper with error handling
- `/src/lib/next/components/` - UI components (card, nav, dialogs, UI)
- `/src/lib/next/types/` - TypeScript type definitions (deck.ts, card.ts, shareUrl.ts)
- `/src/lib/themes/` - Theme definitions and styles
- `/src/routes/+page.svelte` - Main application page

## Development Guidelines

1. **Data Persistence**
   - Always use IndexedDB for storage
   - Implement proper error handling
   - Validate data before saving

2. **State Management**
   - Use the Canon Update pattern for all state changes
   - Provide loading states for user feedback
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
