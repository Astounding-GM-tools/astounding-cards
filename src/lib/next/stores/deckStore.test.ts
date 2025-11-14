import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextDeckStore } from './deckStore.svelte.js';
import { nextDb } from './database.js';

// Mock the database
vi.mock('./database.js', () => ({
	nextDb: {
		init: vi.fn().mockResolvedValue(undefined),
		getDeck: vi.fn(),
		updateDeckMeta: vi.fn(),
		getAllDecks: vi.fn(),
		createDeck: vi.fn()
	},
	DatabaseError: class DatabaseError extends Error {}
}));

// Mock crypto.randomUUID for testing
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: vi.fn(() => 'mock-uuid-' + Math.random())
	}
});

describe('nextDeckStore deck selection persistence', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should update lastEdited timestamp when selecting a deck', async () => {
		const mockDeck = {
			id: 'deck-1',
			meta: {
				title: 'Test Deck',
				theme: 'classic' as const,
				layout: 'tarot' as const,
				createdAt: 1000000,
				lastEdited: 1000000
			},
			cards: []
		};

		const updatedDeck = {
			...mockDeck,
			meta: {
				...mockDeck.meta,
				lastEdited: 1000500 // Updated timestamp
			}
		};

		// Mock database calls
		vi.mocked(nextDb.getDeck).mockResolvedValue(mockDeck);
		vi.mocked(nextDb.updateDeckMeta).mockResolvedValue(updatedDeck);

		// Call selectDeck
		const success = await nextDeckStore.selectDeck('deck-1');

		// Verify success
		expect(success).toBe(true);

		// Verify that getDeck was called
		expect(nextDb.getDeck).toHaveBeenCalledWith('deck-1');

		// Verify that updateDeckMeta was called with lastEdited timestamp
		expect(nextDb.updateDeckMeta).toHaveBeenCalledWith('deck-1', {
			lastEdited: expect.any(Number)
		});

		// Verify the lastEdited timestamp is recent (within last second)
		const lastUpdateCall = vi.mocked(nextDb.updateDeckMeta).mock.calls[0];
		const passedTimestamp = lastUpdateCall[1].lastEdited;
		const now = Date.now();
		expect(passedTimestamp).toBeGreaterThan(now - 1000);
		expect(passedTimestamp).toBeLessThanOrEqual(now);

		// Verify that the store now has the updated deck
		expect(nextDeckStore.deck).toEqual(updatedDeck);
	});

	it('should handle errors when selecting a deck', async () => {
		// Mock database to throw error
		vi.mocked(nextDb.getDeck).mockRejectedValue(new Error('Database error'));

		const success = await nextDeckStore.selectDeck('invalid-deck');

		expect(success).toBe(false);
		expect(nextDeckStore.error).toBe('Database error');
		expect(nextDb.updateDeckMeta).not.toHaveBeenCalled();
	});

	it('should handle case when deck is not found', async () => {
		// Mock database to return null (deck not found)
		vi.mocked(nextDb.getDeck).mockResolvedValue(null);

		const success = await nextDeckStore.selectDeck('nonexistent-deck');

		expect(success).toBe(false);
		expect(nextDeckStore.error).toBe('Deck not found');
		expect(nextDb.updateDeckMeta).not.toHaveBeenCalled();
	});
});

describe('nextDeckStore loadMostRecent behavior', () => {
	it('should load most recent deck based on lastEdited timestamp', async () => {
		const oldDeck = {
			id: 'deck-1',
			meta: {
				title: 'Old Deck',
				theme: 'classic' as const,
				layout: 'tarot' as const,
				createdAt: 1000000,
				lastEdited: 1000000
			},
			cards: []
		};

		const recentDeck = {
			id: 'deck-2',
			meta: {
				title: 'Recent Deck',
				theme: 'classic' as const,
				layout: 'tarot' as const,
				createdAt: 1000100,
				lastEdited: 1000500 // More recent
			},
			cards: []
		};

		// Mock getAllDecks to return decks sorted by lastEdited (most recent first)
		vi.mocked(nextDb.getAllDecks).mockResolvedValue([recentDeck, oldDeck]);

		const success = await nextDeckStore.loadMostRecent();

		expect(success).toBe(true);
		expect(nextDeckStore.deck).toEqual(recentDeck);
	});
});
