# Canon Update Pattern

## Overview

The Canon Update pattern is a robust system for managing state changes in the Card Deck Creator application. It ensures all updates are atomic, consistent, and provide clear user feedback. This pattern replaces the previous optimistic update system, eliminating race conditions and simplifying state management.

## Core Principles

1.  **Single Source of Truth**: The `currentDeck` writable store is the single source of truth for the active deck's state.
2.  **Atomic Database-First Updates**: All changes are first persisted to IndexedDB as a single atomic transaction. Only after the database update is successful is the `currentDeck` store updated.
3.  **Loading States**: The system provides granular loading states for individual fields, giving users clear feedback on in-progress operations.
4.  **Centralized Logic**: All update logic is centralized in `src/lib/stores/canonUpdate.ts`, making it easy to maintain and reuse.
5.  **No Optimistic Updates**: The UI only reflects changes after they have been successfully saved to the database, preventing inconsistencies.

## How It Works

The Canon Update system consists of a set of exported functions that handle updates for different parts of the deck:

- `canonUpdateDeck()`: Updates the deck's metadata (e.g., name, theme, card size).
- `canonUpdateCard()`: Updates a single card's properties.
- `canonUpdateCards()`: Updates multiple cards at once (not yet used, but available for future batch operations).
- `canonDeleteDeck()`: Deletes a deck from the database.

Each of these functions follows the same core logic:

1.  **Set Loading State**: Sets a loading state for the specified fields, disabling UI elements and showing a loading message (e.g., "Updating name...").
2.  **Prepare Updated Deck**: Creates a new deck object with the updated data.
3.  **Save to Database**: Calls `putDeck()` to save the entire updated deck object to IndexedDB.
4.  **Update Store**: If the database update is successful, it updates the `currentDeck` store with the new deck object.
5.  **Show Success Message**: Displays a success toast to the user.
6.  **Clear Loading State**: Clears the loading state, re-enabling UI elements.
7.  **Handle Errors**: If any step fails, it shows an error toast and does not update the `currentDeck` store, ensuring the UI remains consistent with the last known good state.

## Usage

To use the Canon Update system in a component, simply import the desired function and call it with the necessary updates.

### Example: Updating a Card's Name

```svelte
<script>
	import { canonUpdateCard } from '$lib/stores/canonUpdate';

	async function handleNameBlur(e) {
		const newName = e.target.textContent.trim();
		if (newName !== card.name) {
			await canonUpdateCard(card.id, { name: newName }, ['card-name'], 'Updating name...');
		}
	}
</script>

<h2 contenteditable onblur={handleNameBlur}>
	{card.name}
</h2>
```

In this example:

- `card.id`: The ID of the card to update.
- `{ name: newName }`: An object containing the fields to update.
- `['card-name']`: An array of loading state fields to set.
- `'Updating name...'`: The loading message to display.

By following this pattern, all state updates are handled consistently and reliably, ensuring a great user experience and a maintainable codebase.

### Example: Updating Deck Theme

```svelte
<script>
	import { canonUpdateDeck, isFieldLoading } from '$lib/stores/canonUpdate';

	const isThemeUpdating = $derived(isFieldLoading('deck-theme'));

	async function handleThemeChange(newTheme) {
		await canonUpdateDeck(
			{ theme: newTheme },
			['deck-theme'],
			'Updating theme...',
			'Theme updated successfully!'
		);
	}
</script>

<select onchange={(e) => handleThemeChange(e.target.value)} disabled={isThemeUpdating}>
	<option value="classic">Classic</option>
	<option value="cyberdeck">Cyberdeck</option>
	<!-- ... -->
</select>
{#if isThemeUpdating}
	<span>Updating theme...</span>
{/if}
```

### Example: Batch Update Multiple Cards

```svelte
<script>
	import { canonUpdateCards } from '$lib/stores/canonUpdate';

	async function updateAllCardTypes(newType) {
		const updates = cards.map((card) => ({
			cardId: card.id,
			updates: { type: newType }
		}));

		await canonUpdateCards(
			updates,
			['bulk-update'],
			'Updating all cards...',
			'All cards updated successfully!'
		);
	}
</script>
```

## API Reference

### `canonUpdateDeck(updates, loadingFields?, loadingMessage?, successMessage?)`

Updates deck metadata.

**Parameters:**

- `updates: Partial<Deck['meta']>` - Object containing fields to update
- `loadingFields?: string[]` - Array of loading state identifiers
- `loadingMessage?: string` - Message to display during loading
- `successMessage?: string` - Message to display on success

**Returns:** `Promise<boolean>` - True if successful, false otherwise

### `canonUpdateCard(cardId, updates, loadingFields?, loadingMessage?, successMessage?)`

Updates a single card's properties.

**Parameters:**

- `cardId: string` - ID of the card to update
- `updates: Partial<Card>` - Object containing fields to update
- `loadingFields?: string[]` - Array of loading state identifiers
- `loadingMessage?: string` - Message to display during loading
- `successMessage?: string` - Message to display on success

**Returns:** `Promise<boolean>` - True if successful, false otherwise

### `canonUpdateCards(updates, loadingFields?, loadingMessage?, successMessage?)`

Updates multiple cards at once.

**Parameters:**

- `updates: Array<{cardId: string, updates: Partial<Card>}>` - Array of update objects
- `loadingFields?: string[]` - Array of loading state identifiers
- `loadingMessage?: string` - Message to display during loading
- `successMessage?: string` - Message to display on success

**Returns:** `Promise<boolean>` - True if successful, false otherwise

### `isFieldLoading(field)`

Checks if a specific field is currently being updated.

**Parameters:**

- `field: string` - Loading state identifier to check

**Returns:** `boolean` - True if the field is loading

## Loading State Management

The Canon Update system provides granular loading states that can be used to:

- Disable UI elements during updates
- Show loading indicators
- Display progress messages
- Prevent race conditions

### Common Loading Field Names

- `card-name` - Card name updates
- `card-role` - Card role updates
- `card-traits` - Card traits updates
- `card-image` - Card image updates
- `card-description` - Card description updates
- `card-secrets` - Card secrets updates
- `deck-theme` - Deck theme updates
- `deck-size` - Deck card size updates
- `deck-name` - Deck name updates

### Best Practices

1. **Use Descriptive Loading Field Names**: Choose field names that clearly indicate what's being updated.
2. **Provide User Feedback**: Always show loading states and success/error messages.
3. **Disable Interactive Elements**: Disable buttons and inputs during updates to prevent conflicts.
4. **Handle Errors Gracefully**: The system automatically handles errors, but you can provide custom error handling if needed.
5. **Keep Updates Atomic**: Each Canon Update call should represent a single logical operation.
