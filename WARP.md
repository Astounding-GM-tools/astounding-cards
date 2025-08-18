# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Card Deck Creator is a **client-side only** SvelteKit application for creating printable character cards for tabletop RPGs. It runs entirely in the browser with no server dependencies, using IndexedDB for local storage and URL serialization for sharing.

## Key Technologies & Architecture

- **Svelte 5** (runes mode) - Always use modern Svelte 5 syntax and patterns
- **SvelteKit** with Vercel adapter for static deployment
- **TypeScript** for type safety
- **IndexedDB** for client-side storage
- **Canon Update Pattern** for state management (database-first atomic updates)

## Core Development Commands

```bash
# Development
npm run dev                    # Start dev server on http://localhost:5173

# Testing
npm run test                   # Run all tests (unit + e2e)
npm run test:unit              # Run Vitest unit tests only
npm run test:unit:watch        # Run unit tests in watch mode
npm run test:unit:ui           # Run unit tests with UI
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run E2E tests with UI

# Build & Deploy
npm run build                  # Build for production
npm run preview                # Preview production build

# Code Quality
npm run check                  # Type check with svelte-check
npm run format                 # Format code with Prettier
npm run lint                   # Check code formatting
```

## Testing Architecture

The project has a sophisticated dual-testing approach:

### Unit Tests (Vitest)
- **Target**: `.svelte.ts` logic files (extracted business logic)
- **Location**: Co-located with components (e.g., `Component.svelte.test.ts`)
- **Coverage**: High coverage requirements (90%+ thresholds)
- **Speed**: Milliseconds per test
- **Environment**: jsdom for browser APIs

### E2E Tests (Playwright)
- **Target**: User workflows and component integration
- **Location**: `/e2e/` directory
- **Pattern**: Uses DevToolsHelper class for fast test setup
- **Environment**: Real browser (Chromium)
- **Data**: Consistent sample data via `window.e2eHelpers`

### Key Testing Patterns

1. **Logic Extraction Pattern**:
   - Extract business logic from `.svelte` files into `.svelte.ts` files
   - Keep components focused on presentation
   - Unit test the extracted logic extensively

2. **E2E Dev Tools Integration**:
   ```typescript
   // Fast test setup using console helpers
   await devTools.setupTestEnvironment(); // Bypasses UI setup
   await devTools.clearDatabaseConsole(); // Direct database operations
   ```

3. **Test IDs**: Use `data-testid` attributes for reliable element targeting

## Key Architecture Patterns

### Canon Update Pattern
The application uses a **Canon Update Pattern** for all state changes:
- Database-first atomic updates
- Granular loading states for user feedback
- No optimistic updates - UI reflects persisted state only
- Centralized update logic in `canonUpdate.ts`

### Component Structure
```
src/lib/components/
├── cards/           # Card display and editing components
├── deck/            # Deck management components  
├── dialogs/         # Modal dialogs
└── ui/              # Reusable UI components
```

### Logic Extraction Pattern
Components follow this pattern:
```
Component.svelte          # Presentation layer only
Component.svelte.ts       # Extracted business logic
Component.svelte.test.ts  # Unit tests for logic
Component.component.test.ts # Integration tests
```

## File Structure & Organization

- `/src/lib/stores/` - Svelte stores and state management
- `/src/lib/components/` - All UI components
- `/src/lib/types.ts` - TypeScript type definitions
- `/src/lib/themes/` - Theme definitions and styles
- `/docs/` - Comprehensive project documentation
- `/e2e/` - End-to-end tests and helpers
- `/e2e/helpers/dev-tools.ts` - E2E testing utilities

## Development Guidelines

### Svelte 5 Requirements
- **Always use Svelte 5 syntax** (runes mode)
- Use `$state()`, `$derived()`, `$effect()` instead of legacy stores in components
- Follow modern reactive patterns

### State Management
- Use Canon Update Pattern for all data changes
- Provide loading states for user feedback
- Handle errors gracefully with toast notifications
- Maintain scroll position during updates

### Testing Requirements
- Extract business logic to `.svelte.ts` files
- Achieve 90%+ code coverage on logic files
- Use E2E tests for user workflows
- Leverage DevToolsHelper for fast E2E setup

### Component Patterns
- Keep components focused on presentation
- Extract complex logic to separate files
- Use TypeScript for all logic files
- Follow accessibility guidelines

## Key Files to Know

- `src/lib/stores/deck.ts` - Core deck state management
- `src/lib/stores/canonUpdate.ts` - Canon Update pattern implementation
- `e2e/helpers/dev-tools.ts` - E2E testing utilities
- `docs/DEVELOPMENT_METHODOLOGY.md` - Detailed development approach
- `docs/ARCHITECTURE.md` - System architecture overview

## Common Patterns

### Creating New Components
1. Create `.svelte` file for presentation
2. Extract logic to `.svelte.ts` file
3. Write unit tests for logic in `.svelte.test.ts`
4. Add E2E tests if component has user workflows
5. Use `data-testid` attributes for testing

### Running Single Tests
```bash
# Run specific unit test file
npx vitest path/to/test.ts

# Run specific E2E test
npx playwright test --grep "test name"
```

### Database Operations (E2E Testing)
```typescript
// Setup test environment with sample data
await devTools.setupTestEnvironment();

// Clear database for clean tests
await devTools.clearDatabaseConsole();

// Add specific test data
await devTools.addSampleDataConsole();
```

## Deployment Notes

- **Client-side only** - no server configuration needed
- Uses Vercel adapter for static deployment
- All data stored locally in IndexedDB
- Sharing via URL serialization (no backend required)
- Works completely offline after initial load

## Current Project Status

- **Components with extracted logic**: CardFront, CardBack, CardStatsEditor, CardMechanicsEditor, DeckManager, StatblockVocabularyEditor
- **E2E test coverage**: Statblock workflows, card mechanics editing
- **Test count**: 244+ tests (231 unit + 13+ E2E)
- **Next refactoring targets**: ImageSelector, DeckList, ShareDialog (see docs/CLEANUP_AND_NEXT_STEPS.md)
