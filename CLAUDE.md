# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Card Deck Creator is a **client-side only** application for creating and managing custom cards for tabletop RPGs, board games, or any creative project. Built with SvelteKit, it runs entirely in the browser with no server-side dependencies (except optional AI features).

**Live app**: [cards.astounding.games](https://cards.astounding.games)

## Essential Commands

### Development
```bash
npm run dev                    # Start dev server (localhost:5173)
npm run build                  # Build for production
npm run preview                # Preview production build
npm run check                  # Run svelte-check for type errors
npm run check:watch            # Watch mode for type checking
```

### Testing
```bash
npm run test                   # Run all tests (unit + E2E)
npm run test:unit              # Run unit tests once
npm run test:unit:watch        # Run unit tests in watch mode (recommended during development)
npm run test:unit:ui           # Run unit tests with Vitest UI
npm run test:unit:coverage     # Generate coverage report
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run E2E tests with Playwright UI
```

### Code Quality
```bash
npm run format                 # Format code with Prettier
npm run lint                   # Check code formatting
```

### Storybook (Component Development)
```bash
npm run storybook              # Start Storybook on port 6006
npm run build-storybook        # Build Storybook for deployment
```

## Architecture Overview

### Client-Side Only Design
- All data stored in browser using **IndexedDB** (local-first)
- No server-side API or database required for core features
- Images stored as blobs in IndexedDB
- Deck sharing via URL serialization
- Optional server-side features: AI generation (Gemini), image hosting (Cloudflare R2), authentication (Supabase)

### State Management: Canon Update Pattern

**Critical**: This project uses a **Canon Update Pattern** for all state changes. This is the most important pattern to understand.

**Core Principles:**
1. **Database-first atomic updates** - Changes persist to IndexedDB first, then update UI
2. **Single source of truth** - The store reflects what's in the database
3. **No optimistic updates** - UI only reflects persisted state
4. **Granular loading states** - Show users what's happening during operations
5. **Centralized logic** - All updates go through standardized functions

**Files to reference:**
- `docs/CANON_UPDATE_PATTERN.md` - Detailed pattern documentation
- `src/lib/stores/canonUpdate.ts` (legacy)
- `src/lib/next/stores/deckStore.svelte.ts` (new system)

**Usage example:**
```typescript
// In a component
await canonUpdateCard(cardId, { name: newName }, ['card-name'], 'Updating name...');
```

### Svelte 5 Runes Mode (CRITICAL)

**This project uses Svelte 5 runes mode exclusively.** Never use Svelte 4 syntax.

**Always use:**
- `$props()` for component props (never `export let`)
- `$state()` for reactive local variables
- `$derived()` for computed values (never `$:`)
- `$effect()` for side effects (never `$:` reactive blocks)

**Example:**
```typescript
const props = $props<{ required: string; optional?: boolean }>();
let count = $state(0);
const doubled = $derived(count * 2);
$effect(() => {
  console.log('count changed:', count);
});
```

See `docs/DEVELOPMENT_RULES.md` for complete examples.

### Logic Extraction Pattern

**Critical development methodology**: Extract business logic from Svelte components into `.svelte.ts` files.

**Why:**
- Pure TypeScript functions are easier to test, debug, and reason about
- Unit tests run in milliseconds (vs seconds for component tests)
- Enable fearless refactoring with 100% test coverage
- Parallel development of logic and UI

**Structure:**
```
MyComponent.svelte           # Pure presentation
MyComponent.svelte.ts        # Extracted logic and types
MyComponent.svelte.test.ts   # Unit tests for logic
```

See `docs/DEVELOPMENT_METHODOLOGY.md` for detailed examples and the complete testing strategy.

## Directory Structure

```
src/
├── lib/
│   ├── next/                    # Current active codebase (will be moved to root)
│   │   ├── components/          # Svelte components
│   │   │   ├── nav/            # Navigation/header components
│   │   │   ├── card/           # Card display components
│   │   │   ├── dialogs/        # Dialog/modal components
│   │   │   └── ui/             # Reusable UI components
│   │   ├── stores/              # State management (deckStore.svelte.ts, database.ts, auth.ts)
│   │   ├── types/               # TypeScript types (deck.ts, card.ts, shareUrl.ts)
│   │   ├── utils/               # Utility functions (idUtils, shareUrlUtils, etc.)
│   │   ├── data/                # Static data and templates
│   │   └── styles/              # CSS styles
│   ├── stores/                  # Legacy stores (to be removed)
│   ├── themes/                  # Card themes (Classic, Cyberdeck, Cordial, Scriptorum)
│   ├── ai/                      # AI generation (image prompts, generators)
│   └── utils/                   # Shared utilities
├── routes/
│   ├── +page.svelte             # Main app (uses src/lib/next/ components)
│   ├── +layout.svelte           # Root layout
│   ├── api/                     # API endpoints (AI, auth, images, tokens)
│   ├── [slug]/                  # Deck import/preview by slug
│   ├── gallery/                 # Public gallery
│   └── dashboard/               # User dashboard (if authenticated)
└── stories/                     # Storybook stories

e2e/                             # Playwright E2E tests
docs/                            # Comprehensive documentation
```

## Key Files to Understand

### State Management
- `src/lib/next/stores/deckStore.svelte.ts` - Main deck store (new system, uses Canon Update Pattern)
- `src/lib/next/stores/database.ts` - IndexedDB wrapper with error handling
- `src/lib/stores/canonUpdate.ts` - Legacy Canon Update implementation

### Type Definitions
- `src/lib/next/types/deck.ts` - Deck and Layout types
- `src/lib/next/types/card.ts` - Card types
- `src/lib/next/types/shareUrl.ts` - URL sharing types

### Core Utilities
- `src/lib/next/utils/idUtils.ts` - ID generation and slug creation
- `src/lib/next/utils/shareUrlUtils.ts` - Deck sharing via URL
- `src/lib/next/utils/deckMerging.ts` - Merge imported decks with existing data

### API Routes (Optional Features)
- `src/routes/api/ai/+server.ts` - AI card generation (Gemini)
- `src/routes/api/images/+server.ts` - Image hosting (Cloudflare R2)
- `src/routes/api/auth/+server.ts` - Authentication (Supabase)

## Testing Strategy

### Unit Tests (Vitest)
- **Target**: 100% coverage for `.svelte.ts` logic files
- **Speed**: Milliseconds per test
- **Run during development**: `npm run test:unit:watch`
- **Coverage thresholds**: 90% branches/functions/lines/statements
- **Focus**: Pure business logic, not Svelte components

### E2E Tests (Playwright)
- **Target**: Core user workflows and integration
- **Speed**: 1-2 seconds for successful tests
- **Run before commits**: `npm run test:e2e`
- **Focus**: End-to-end user experience

### Storybook Tests
- Visual component testing and documentation
- Run via Vitest browser mode
- Access at `http://localhost:6006`

## Environment Variables

Required only for optional server-side features:

```bash
# Supabase (authentication, public gallery)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_API_KEY=your-secret-key

# Cloudflare R2 (image hosting)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=astounding-cards-images
R2_PATH_PREFIX=dev
R2_PUBLIC_URL=https://pub-xyz.r2.dev

# Gemini AI (card generation)
GEMINI_API_KEY=your-api-key
```

See `.env.example` for complete configuration.

## Development Workflow

### Daily Development Cycle
1. Start unit tests in watch mode: `npm run test:unit:watch`
2. Write logic in `.svelte.ts` files with accompanying tests
3. Update Svelte components to use new logic
4. Run E2E tests: `npm run test:e2e`
5. Commit when all tests pass

### Adding a New Feature
1. **Design logic**: Define interfaces and functions in `.svelte.ts`
2. **Write unit tests**: Cover all logic paths with Vitest
3. **Implement**: Make tests pass
4. **Component integration**: Update Svelte components
5. **E2E verification**: Test complete user workflows
6. **Refactor**: Clean up with confidence (tests protect you)

## Important Patterns

### Data Persistence
- Always use IndexedDB via `nextDb` from `database.ts`
- All operations are async and may throw `DatabaseError`
- Validate data before saving
- Handle errors gracefully with try/catch

### Component Development
- Keep components focused on presentation
- Extract complex logic to `.svelte.ts` files
- Use proper TypeScript types
- Follow accessibility guidelines
- Support print layout (optimized for double-sided A4)

### Error Handling
- All database operations can throw `DatabaseError`
- Show user-friendly error messages
- Log errors for debugging
- Don't leave users in broken states

## Common Tasks

### Creating a New Card Type
1. Update `src/lib/next/types/card.ts` with new type
2. Add template in `src/lib/next/data/`
3. Create or update theme styles in `src/lib/themes/`
4. Write unit tests for any new logic
5. Add E2E test for the workflow

### Adding a New Theme
1. Create theme file in `src/lib/themes/styles/`
2. Register in theme system
3. Add preview/selection UI
4. Test print layout

### Debugging Tips
- Use `npm run test:unit:ui` for interactive test debugging
- Use `npm run test:e2e:ui` for Playwright debugging
- Check browser DevTools IndexedDB for data persistence issues
- Use Storybook for component isolation: `npm run storybook`

## Codebase Cleanup Status

The project is in active cleanup/flattening mode:

**Current state:**
- Main route is `src/routes/+page.svelte` (root level)
- Active codebase is in `src/lib/next/` (components, stores, types, utils)
- Root page imports from `src/lib/next/` paths

**Completed cleanup:**
1. ✅ Moved `src/routes/next/gallery/` to `src/routes/gallery/`
2. ✅ Deleted deprecated route directories: `src/routes/next/`, `src/routes/legacy/`, `src/routes/test-*`

**Remaining cleanup:**
1. Move `src/lib/next/*` contents to `src/lib/` (flatten the structure)
2. Delete `src/lib/stores/` (legacy Canon Update implementation)

**For new development:**
- Work in `src/lib/next/` for now (active codebase)
- All routes are at root level - no more `/next` or `/legacy` prefixes
- The `src/lib/next/` directory will be flattened to `src/lib/` soon

## Additional Documentation

- `docs/ARCHITECTURE.md` - System design and technical patterns
- `docs/CANON_UPDATE_PATTERN.md` - State management system
- `docs/DEVELOPMENT_RULES.md` - Svelte 5 runes mode standards
- `docs/DEVELOPMENT_METHODOLOGY.md` - Testing and iteration methodology
- `docs/ROADMAP.md` - Future plans and feature roadmap
- `docs/USAGE.md` - User guide
- `README.md` - Project overview and setup

## Deployment

Built with Vercel adapter (`@sveltejs/adapter-vercel`):
- Runtime: Node.js 20.x
- Static client-side app with optional API routes
- No special deployment configuration needed
- Environment variables configured in Vercel dashboard
