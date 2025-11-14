# Character to Card Migration Plan

## Overview

This document outlines the plan to migrate from "Character"-based terminology to "Card"-based terminology throughout the codebase. Since we're pre-launch, we don't need to maintain backward compatibility and can make breaking changes.

## Phase 1: Type System

The foundation of the change, affecting all other parts.

### 1.1 Core Types (`types.ts`)

```typescript
// New base interface
export interface Card {
	id: string;
	name: string;
	role: string;
	portrait: string | null;
	portraitBlob?: Blob;
	traits: string[];
	secrets: string[];
	desc: string;
	type: 'character' | 'location' | 'item' | string;
	stat?: CardStat; // Already correctly named
}

// New deck interface
export interface Deck {
	id: string;
	meta: {
		name: string;
		theme: string;
		cardSize: CardSize; // Already correctly named
		lastEdited: number;
		createdAt: number;
	};
	cards: Card[];
}
```

### 1.2 Validation Functions

```typescript
export function validateCard(card: Partial<Card>): ValidationError[];
export function validateDeck(deck: Partial<Deck>): ValidationError[];
```

### 1.3 Type Guards

```typescript
export function isCard(card: unknown): card is Card;
export function isDeck(deck: unknown): deck is Deck;
```

## Phase 2: Database Schema

Database changes that reflect the new types.

### 2.1 Schema Updates (`schema.ts`)

```typescript
export const decks = pgTable('decks', {
	// Existing fields remain the same
});

export const cards = pgTable('cards', {
	id: text('id').primaryKey(),
	deckId: text('deck_id')
		.notNull()
		.references(() => decks.id),
	name: text('name').notNull(),
	role: text('role').notNull(),
	portrait: text('portrait'),
	type: text('type').notNull() // Explicit type field
	// ... other fields
});
```

### 2.2 Migration Script

```sql
-- Rename tables
ALTER TABLE characters RENAME TO cards;

-- Add type column with default
ALTER TABLE cards ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'character';

-- Update existing records
UPDATE cards SET type = 'character' WHERE type IS NULL;
```

## Phase 3: Store and Functions

Update the data management layer.

### 3.1 Card Store (`stores/cards.ts` → `stores/deck.ts`)

- Rename file to `deck.ts`
- Update store names:
  - `currentDeck` (keep name)
  - `validationErrors` (keep name)
- Update functions:
  - `addCard`
  - `updateCard`
  - `deleteCards`
  - `copyCards`
  - `saveDeck`
  - `loadDeck`

### 3.2 URL Handling

- Update `deckToUrl` and `deckFromUrl` to use new types
- Update validation in URL import/export

## Phase 4: Components

Rename and update components to reflect new terminology.

### 4.1 Core Components

- `CharacterCardFront.svelte` → `CardFront.svelte`
- `CharacterCardBack.svelte` → `CardBack.svelte`
- `Card.svelte` (keep name)
- `CardStatSelector.svelte` (keep name)

### 4.2 Management Components

- Update `DeckManager.svelte`
- Update `DeckList.svelte`
- Update `DeckSelector.svelte`
- Update `PagedCards.svelte`

### 4.3 New Components

- Create `CardTypeSelector.svelte` for explicit type selection
- Update `ImageSelector.svelte` props

## Phase 5: UI Text and Documentation

Update all user-facing text and documentation.

### 5.1 Button Labels and Messages

- "Add Card" instead of "Add Character"
- "No cards in deck" instead of "No characters in deck"
- Update all toast messages

### 5.2 Documentation

- Update README.md
- Update USAGE.md
- Update THEMING.md
- Update comments throughout codebase

## Phase 6: Testing and Verification

### 6.1 Type Verification

- Verify TypeScript compilation
- Check type inference in components
- Verify prop types

### 6.2 Functionality Testing

- Test card creation of each type
- Test card editing
- Test deck management
- Test import/export
- Test URL sharing

### 6.3 UI Testing

- Verify all messages and labels
- Check accessibility attributes
- Test responsive layout

## Implementation Order

1. **Clear Database**

   ```typescript
   await clearDatabase(); // Start fresh
   ```

2. **Type System**
   - Implement new types
   - Update validation
   - Fix TypeScript errors

3. **Database**
   - Apply schema changes
   - Test with sample data

4. **Store Layer**
   - Update store functionality
   - Migrate to new types
   - Test CRUD operations

5. **Components**
   - Rename and update components
   - Fix imports
   - Update props and types

6. **UI and Docs**
   - Update text content
   - Update documentation
   - Final testing

## Notes

- Each phase should be completed and tested before moving to the next
- Components depending on renamed components should be updated together
- Keep consistent terminology throughout
- Test thoroughly after each major change
