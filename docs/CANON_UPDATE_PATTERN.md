# Canon Update Pattern

## Overview

The Canon Update pattern is a robust system for managing state changes in the Card Deck Creator application. It ensures all updates are atomic, consistent, and provide clear user feedback. This pattern replaces the previous optimistic update system, eliminating race conditions and simplifying state management.

## Core Principles

1.  **Single Source of Truth**: The deck store (using Svelte 5 runes) is the single source of truth for the active deck's state.
2.  **Atomic Database-First Updates**: All changes are first persisted to IndexedDB as a single atomic transaction. Only after the database update is successful is the store updated.
3.  **Loading States**: The system provides granular loading states for individual operations, giving users clear feedback on in-progress operations.
4.  **Centralized Logic**: All update logic is centralized in `src/lib/next/stores/deckStore.svelte.ts`, making it easy to maintain and reuse.
5.  **No Optimistic Updates**: The UI only reflects changes after they have been successfully saved to the database, preventing inconsistencies.

## How It Works

The Canon Update system in `src/lib/next/stores/deckStore.svelte.ts` provides methods that handle updates for different parts of the deck:

- `updateDeckMeta()`: Updates the deck's metadata (e.g., title, theme, layout).
- `updateCard()`: Updates a single card's properties.
- `addCard()`: Adds a new card to the deck.
- `deleteCard()`: Removes a card from the deck.
- `deleteDeck()`: Deletes the entire deck from the database.

Each of these methods follows the same core logic:

1.  **Set Loading State**: Sets a loading state for the operation, disabling UI elements and showing a loading message (e.g., "Updating card...").
2.  **Prepare Updated Data**: Creates the updated deck object with the new data.
3.  **Save to Database**: Uses `nextDb` (from `database.ts`) to persist changes to IndexedDB.
4.  **Update Store**: If the database update is successful, updates the reactive store state.
5.  **Show Success Message**: Displays a success toast to the user (via toast store).
6.  **Clear Loading State**: Clears the loading state, re-enabling UI elements.
7.  **Handle Errors**: If any step fails, it shows an error toast and does not update the store, ensuring the UI remains consistent with the last known good state.

## Usage

To use the Canon Update system in a component, import the deck store and call its methods.

### Example: Updating a Card

```svelte
<script lang="ts">
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte';

	async function handleNameChange(cardId: string, newName: string) {
		if (newName.trim()) {
			await nextDeckStore.updateCard(cardId, { name: newName });
		}
	}
</script>

<input
	value={card.name}
	onblur={(e) => handleNameChange(card.id, e.currentTarget.value)}
	disabled={nextDeckStore.isLoading}
/>
```

In this example:

- `nextDeckStore.updateCard()`: Updates a card's properties in the database and store.
- `nextDeckStore.isLoading`: Reactive state that indicates if an operation is in progress.
- The method handles loading states, database updates, and error handling automatically.

By following this pattern, all state updates are handled consistently and reliably, ensuring a great user experience and a maintainable codebase.

### Example: Updating Deck Metadata

```svelte
<script lang="ts">
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte';

	async function handleLayoutChange(newLayout: Layout) {
		await nextDeckStore.updateDeckMeta({ layout: newLayout });
	}
</script>

<select
	onchange={(e) => handleLayoutChange(e.currentTarget.value)}
	disabled={nextDeckStore.isLoading}
>
	<option value="poker">Poker</option>
	<option value="tarot">Tarot</option>
</select>
{#if nextDeckStore.isLoading}
	<span>{nextDeckStore.loadingMessage}</span>
{/if}
```

### Example: Adding a New Card

```svelte
<script lang="ts">
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte';

	async function handleAddCard() {
		const newCard = await nextDeckStore.addCard();
		if (newCard) {
			// Open edit dialog or navigate to new card
			console.log('Created card:', newCard.id);
		}
	}
</script>

<button onclick={handleAddCard} disabled={nextDeckStore.isLoading}>
	Add Card
</button>
```

## API Reference

All methods are available on the `nextDeckStore` object from `src/lib/next/stores/deckStore.svelte.ts`.

### `updateDeckMeta(updates: Partial<DeckMeta>)`

Updates deck metadata.

**Parameters:**
- `updates: Partial<DeckMeta>` - Object containing metadata fields to update (title, layout, imageStyle, etc.)

**Returns:** `Promise<boolean>` - True if successful, false otherwise

### `updateCard(cardId: string, updates: Partial<Card>)`

Updates a single card's properties.

**Parameters:**
- `cardId: string` - ID of the card to update
- `updates: Partial<Card>` - Object containing card fields to update

**Returns:** `Promise<boolean>` - True if successful, false otherwise

### `addCard(templateCard?: Partial<Card>)`

Adds a new card to the deck.

**Parameters:**
- `templateCard?: Partial<Card>` - Optional template data for the new card

**Returns:** `Promise<Card | null>` - The created card, or null if failed

### `deleteCard(cardId: string)`

Removes a card from the deck.

**Parameters:**
- `cardId: string` - ID of the card to delete

**Returns:** `Promise<boolean>` - True if successful, false otherwise

### Reactive Properties

Access these properties directly on `nextDeckStore`:

- `deck` - Current deck object (read-only)
- `isLoading` - Boolean indicating if an operation is in progress
- `loadingMessage` - String describing the current operation
- `error` - String containing error message, or null
- `hasCards` - Boolean indicating if deck has any cards
- `cardCount` - Number of cards in the deck

## Loading State Management

The Canon Update system provides automatic loading states that can be used to:

- Disable UI elements during updates
- Show loading indicators
- Display progress messages
- Prevent race conditions

### Loading State Properties

The deck store provides reactive loading state via Svelte 5 runes:

```typescript
let isLoading = $derived(nextDeckStore.isLoading);
let message = $derived(nextDeckStore.loadingMessage);
let operation = $derived(nextDeckStore.loadingOperation);
```

Use these in your components:

```svelte
<button disabled={nextDeckStore.isLoading}>
	{nextDeckStore.isLoading ? nextDeckStore.loadingMessage : 'Save Changes'}
</button>
```

### Best Practices

1. **Check Loading State**: Always disable interactive elements when `isLoading` is true.
2. **Provide User Feedback**: Show `loadingMessage` to users during operations.
3. **Handle Errors**: Check the `error` property and display it to users when set.
4. **Keep Updates Atomic**: Each store method call represents a single logical operation.
5. **Use Svelte 5 Runes**: Use `$derived()` to reactively access store properties in components.
