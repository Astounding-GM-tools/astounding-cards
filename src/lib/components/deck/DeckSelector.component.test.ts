import { describe, it, expect } from 'vitest';

describe('DeckSelector Component Integration', () => {
	it('should import all extracted logic functions without errors', async () => {
		// This test verifies that the DeckSelector component can import all extracted logic
		const module = await import('./DeckSelector.svelte.ts');

		// Verify all expected exports are present and are functions/types
		expect(typeof module.createDeckSelectorState).toBe('function');
		expect(typeof module.handleDeckDialogKeydown).toBe('function');
		expect(typeof module.createNewDeckObject).toBe('function');
		expect(typeof module.sortDecksByLastEdited).toBe('function');
		expect(typeof module.getCardSizeInfo).toBe('function');
		expect(typeof module.resetNewDeckDialog).toBe('function');
		expect(typeof module.openNewDeckDialog).toBe('function');
		expect(typeof module.setThemeSelectVisible).toBe('function');
		expect(typeof module.updateNewDeckName).toBe('function');

		// Test state management functions
		const initialState = module.createDeckSelectorState();
		expect(initialState.showThemeSelect).toBe(false);
		expect(initialState.showNewDeckDialog).toBe(false);
		expect(initialState.newDeckName).toBe('');

		// Test state updates
		const openState = module.openNewDeckDialog(initialState);
		expect(openState.showNewDeckDialog).toBe(true);

		const resetState = module.resetNewDeckDialog(openState);
		expect(resetState.showNewDeckDialog).toBe(false);
		expect(resetState.newDeckName).toBe('');
	});

	it('should test utility functions', async () => {
		const module = await import('./DeckSelector.svelte.ts');

		// Test createNewDeckObject
		const newDeck = module.createNewDeckObject('Test Deck');
		expect(newDeck.meta.name).toBe('Test Deck');
		expect(newDeck.meta.theme).toBe('classic');
		expect(newDeck.meta.cardSize).toBe('poker');
		expect(newDeck.cards).toEqual([]);

		// Test getCardSizeInfo
		expect(module.getCardSizeInfo('poker')).toBe('Standard playing card size, 9 cards per page');
		expect(module.getCardSizeInfo('tarot')).toBe(
			'Larger cards with more readable text, 4 cards per page'
		);

		// Test sortDecksByLastEdited
		const mockDecks = [
			{
				id: '1',
				meta: {
					lastEdited: 100,
					name: 'Old',
					theme: 'classic',
					cardSize: 'poker' as const,
					createdAt: 100
				},
				cards: []
			},
			{
				id: '2',
				meta: {
					lastEdited: 200,
					name: 'New',
					theme: 'classic',
					cardSize: 'poker' as const,
					createdAt: 200
				},
				cards: []
			}
		];
		const sorted = module.sortDecksByLastEdited(mockDecks);
		expect(sorted[0].meta.name).toBe('New');
		expect(sorted[1].meta.name).toBe('Old');
	});

	it('should test keyboard event handler', async () => {
		const module = await import('./DeckSelector.svelte.ts');

		let enterCalled = false;
		let escapeCalled = false;

		const handlers = {
			onEnter: () => {
				enterCalled = true;
			},
			onEscape: () => {
				escapeCalled = true;
			}
		};

		// Test Enter key with valid name
		const enterEvent = { key: 'Enter' } as KeyboardEvent;
		module.handleDeckDialogKeydown(enterEvent, 'Valid Name', handlers);
		expect(enterCalled).toBe(true);

		// Test Escape key
		const escapeEvent = { key: 'Escape' } as KeyboardEvent;
		module.handleDeckDialogKeydown(escapeEvent, 'Any Name', handlers);
		expect(escapeCalled).toBe(true);

		// Reset and test Enter with empty name
		enterCalled = false;
		const enterEventEmpty = { key: 'Enter' } as KeyboardEvent;
		module.handleDeckDialogKeydown(enterEventEmpty, '', handlers);
		expect(enterCalled).toBe(false); // Should not call onEnter with empty name
	});
});
