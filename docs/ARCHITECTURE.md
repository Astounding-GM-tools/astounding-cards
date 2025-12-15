# Card Deck Creator Architecture

## Overview

Card Deck Creator is primarily a client-side application built with SvelteKit. Core creation, editing, and printing run in the browser (offline-first). A minimal backend supports publishing, gallery, likes, tokens, and payments via Supabase and Lemon Squeezy webhooks.

## Key Design Decisions

### 1. Client-First with Minimal Backend

- IndexedDB for local-first storage (decks/cards; offline)
- URL serialization for sharing
- Images can be local blobs; hosted images use R2/S3 for published content
- Backend services:
  - Supabase (auth, published/user decks, tokens/transactions, RLS)
  - Lemon Squeezy (checkout; webhook endpoint updates credits)

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

Deployed as a static frontend plus serverless API routes:

- Frontend: SvelteKit static adapter
- API routes: `/api/*` for tokens (purchase, webhook), gallery, publishing
- Environment: Supabase project + Lemon Squeezy webhook URL
- No dedicated servers required; APIs run on edge/serverless

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
