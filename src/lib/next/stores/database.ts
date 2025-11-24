/**
 * Database Layer for Next System
 *
 * Simple, focused database operations for the new architecture:
 * - Single deck store (for now)
 * - Atomic updates with Canon Update pattern
 * - Clean separation of concerns
 *
 * Database: "astounding-cards"
 * Store: "decks" (key: deck.id, value: Deck)
 */

import type { Deck, Theme, Layout, ImageStyle } from '../types/deck.js';
import type { Card } from '../types/card.js';
import { safeDeepClone } from '$lib/utils/clone-utils.js';
import { generateId, generateKey } from '../utils/idUtils.js';
import { getSampleCards } from '../data/sampleCards.js';

export class DatabaseError extends Error {
	constructor(
		message: string,
		public code: string
	) {
		super(message);
		this.name = 'DatabaseError';
	}
}

class NextDatabase {
	private db: IDBDatabase | null = null;
	private readonly dbName = 'astounding-cards';
	private readonly dbVersion = 1;
	private readonly deckStore = 'decks';

	/**
	 * Initialize database connection
	 */
	async init(): Promise<void> {
		if (this.db) return;

		// Check if we're in a browser environment
		if (typeof window === 'undefined' || !window.indexedDB) {
			throw new DatabaseError('IndexedDB not available', 'DB_NOT_AVAILABLE');
		}

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.dbVersion);

			request.onerror = () => {
				reject(new DatabaseError('Failed to open database', 'DB_OPEN_ERROR'));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create decks store
				if (!db.objectStoreNames.contains(this.deckStore)) {
					const store = db.createObjectStore(this.deckStore, { keyPath: 'id' });

					// Index for quick lookups
					store.createIndex('lastEdited', 'meta.lastEdited', { unique: false });
					store.createIndex('title', 'meta.title', { unique: false });
				}
			};
		});
	}

	/**
	 * Ensure database is initialized
	 */
	private async ensureInit(): Promise<IDBDatabase> {
		if (!this.db) {
			await this.init();
		}
		if (!this.db) {
			throw new DatabaseError('Database not initialized', 'DB_NOT_INITIALIZED');
		}
		return this.db;
	}

	/**
	 * Create a new deck with default card
	 */
	async createDeck(
		title: string,
		theme: Theme = 'classic',
		layout: Layout = 'tarot',
		imageStyle: ImageStyle = 'classic'
	): Promise<Deck> {
		const db = await this.ensureInit();
		const now = Date.now();

		const deck: Deck = {
			id: generateId(),
			meta: {
				title,
				theme,
				imageStyle,
				layout,
				lastEdited: now,
				createdAt: now
			},
			cards: [this.createDefaultCard()]
		};

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.deckStore], 'readwrite');
			const store = transaction.objectStore(this.deckStore);

			const request = store.add(deck);

			request.onsuccess = () => resolve(deck);
			request.onerror = () =>
				reject(new DatabaseError('Failed to create deck', 'DECK_CREATE_ERROR'));
		});
	}

	/**
	 * Get deck by ID
	 */
	async getDeck(deckId: string): Promise<Deck | null> {
		const db = await this.ensureInit();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.deckStore], 'readonly');
			const store = transaction.objectStore(this.deckStore);

			const request = store.get(deckId);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(new DatabaseError('Failed to get deck', 'DECK_GET_ERROR'));
		});
	}

	/**
	 * Get all decks (sorted by lastEdited desc)
	 */
	async getAllDecks(): Promise<Deck[]> {
		const db = await this.ensureInit();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.deckStore], 'readonly');
			const store = transaction.objectStore(this.deckStore);
			const index = store.index('lastEdited');

			const request = index.getAll();

			request.onsuccess = () => {
				const decks = request.result || [];
				// Sort by lastEdited descending (most recent first)
				decks.sort((a, b) => b.meta.lastEdited - a.meta.lastEdited);
				resolve(decks);
			};
			request.onerror = () =>
				reject(new DatabaseError('Failed to get all decks', 'DECKS_GET_ERROR'));
		});
	}

	/**
	 * Update deck metadata (title, theme, layout)
	 */
	async updateDeckMeta(deckId: string, updates: Partial<Deck['meta']>): Promise<Deck> {
		const deck = await this.getDeck(deckId);
		if (!deck) {
			throw new DatabaseError('Deck not found', 'DECK_NOT_FOUND');
		}

		// Don't update lastEdited if we're only updating publish-related metadata
		// This prevents the publish action from marking the deck as "edited"
		const isPublishMetadataOnly = Object.keys(updates).every(key =>
			['lastPublished', 'published_deck_id', 'published_slug'].includes(key)
		);

		const updatedDeck: Deck = {
			...deck,
			meta: {
				...deck.meta,
				...updates,
				lastEdited: isPublishMetadataOnly ? deck.meta.lastEdited : Date.now()
			}
		};

		return this.saveDeck(updatedDeck);
	}

	/**
	 * Update a card in the deck (Canon Update Pattern)
	 */
	async updateCard(deckId: string, cardId: string, updates: Partial<Card>): Promise<Deck> {
		const deck = await this.getDeck(deckId);
		if (!deck) {
			throw new DatabaseError('Deck not found', 'DECK_NOT_FOUND');
		}

		const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
		if (cardIndex === -1) {
			throw new DatabaseError('Card not found', 'CARD_NOT_FOUND');
		}

		const updatedCards = [...deck.cards];
		updatedCards[cardIndex] = {
			...updatedCards[cardIndex],
			...updates
		};

		const updatedDeck: Deck = {
			...deck,
			cards: updatedCards,
			meta: {
				...deck.meta,
				lastEdited: Date.now()
			}
		};

		return this.saveDeck(updatedDeck);
	}

	/**
	 * Add a new card to the deck
	 */
	async addCard(deckId: string, card?: Partial<Card>): Promise<Deck> {
		const deck = await this.getDeck(deckId);
		if (!deck) {
			throw new DatabaseError('Deck not found', 'DECK_NOT_FOUND');
		}

		const newCard: Card = {
			...this.createDefaultCard(),
			...card
		};

		const updatedDeck: Deck = {
			...deck,
			cards: [...deck.cards, newCard],
			meta: {
				...deck.meta,
				lastEdited: Date.now()
			}
		};

		return this.saveDeck(updatedDeck);
	}

	/**
	 * Remove a card from the deck
	 */
	async removeCard(deckId: string, cardId: string): Promise<Deck> {
		const deck = await this.getDeck(deckId);
		if (!deck) {
			throw new DatabaseError('Deck not found', 'DECK_NOT_FOUND');
		}

		const updatedDeck: Deck = {
			...deck,
			cards: deck.cards.filter((c) => c.id !== cardId),
			meta: {
				...deck.meta,
				lastEdited: Date.now()
			}
		};

		return this.saveDeck(updatedDeck);
	}

	/**
	 * Add multiple cards to a deck
	 */
	async addCardsToDeck(deckId: string, cards: Card[]): Promise<Deck> {
		const deck = await this.getDeck(deckId);
		if (!deck) {
			throw new DatabaseError('Deck not found', 'DECK_NOT_FOUND');
		}

		const updatedDeck: Deck = {
			...deck,
			cards: [...deck.cards, ...cards],
			meta: {
				...deck.meta,
				lastEdited: Date.now()
			}
		};

		return this.saveDeck(updatedDeck);
	}

	/**
	 * Update multiple cards in the deck (Canon Update Pattern)
	 */
	async updateMultipleCards(
		deckId: string,
		cardUpdates: Array<{ cardId: string; updates: Partial<Card> }>
	): Promise<Deck> {
		const deck = await this.getDeck(deckId);
		if (!deck) {
			throw new DatabaseError('Deck not found', 'DECK_NOT_FOUND');
		}

		const updatedCards = deck.cards.map((card) => {
			const update = cardUpdates.find((u) => u.cardId === card.id);
			if (update) {
				return {
					...card,
					...update.updates
				};
			}
			return card;
		});

		const updatedDeck: Deck = {
			...deck,
			cards: updatedCards,
			meta: {
				...deck.meta,
				lastEdited: Date.now()
			}
		};

		return this.saveDeck(updatedDeck);
	}

	/**
	 * Duplicate an existing deck with a new name
	 */
	async duplicateDeck(deckId: string, newTitle?: string): Promise<Deck> {
		const originalDeck = await this.getDeck(deckId);
		if (!originalDeck) {
			throw new DatabaseError('Deck not found', 'DECK_NOT_FOUND');
		}

		const now = Date.now();
		const duplicateName = newTitle || `${originalDeck.meta.title} (Copy)`;

		// Create deep copy of deck with new IDs
		const duplicatedDeck: Deck = {
			id: generateId(),
			meta: {
				...originalDeck.meta,
				title: duplicateName,
				lastEdited: now,
				createdAt: now
			},
			// Clone all cards with new IDs
			cards: originalDeck.cards.map((card) => ({
				...safeDeepClone(card),
				id: generateKey()
			}))
		};

		const db = await this.ensureInit();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.deckStore], 'readwrite');
			const store = transaction.objectStore(this.deckStore);

			const request = store.add(duplicatedDeck);

			request.onsuccess = () => resolve(duplicatedDeck);
			request.onerror = () =>
				reject(new DatabaseError('Failed to duplicate deck', 'DECK_DUPLICATE_ERROR'));
		});
	}

	/**
	 * Delete entire deck
	 */
	async deleteDeck(deckId: string): Promise<void> {
		const db = await this.ensureInit();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.deckStore], 'readwrite');
			const store = transaction.objectStore(this.deckStore);

			const request = store.delete(deckId);

			request.onsuccess = () => resolve();
			request.onerror = () =>
				reject(new DatabaseError('Failed to delete deck', 'DECK_DELETE_ERROR'));
		});
	}

	/**
	 * Upsert a deck (public). Saves new or existing deck.
	 */
	async upsertDeck(deck: Deck): Promise<Deck> {
		return this.saveDeck(deck);
	}

	/**
	 * Save deck (internal helper)
	 */
	private async saveDeck(deck: Deck): Promise<Deck> {
		const db = await this.ensureInit();

		// Clean deck to remove non-cloneable properties before saving
		const cleanDeck = this.sanitizeDeckForStorage(deck);

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.deckStore], 'readwrite');
			const store = transaction.objectStore(this.deckStore);

			const request = store.put(cleanDeck);

			request.onsuccess = () => resolve(deck); // Return original deck, not cleaned
			request.onerror = (event) => {
				console.error('IndexedDB put error:', event);
				console.error('Failed to save deck:', cleanDeck);
				reject(new DatabaseError('Failed to save deck', 'DECK_SAVE_ERROR'));
			};
		});
	}

	/**
	 * Sanitize deck data for IndexedDB storage
	 * Uses safeDeepClone to handle Blobs and other special objects properly
	 */
	private sanitizeDeckForStorage(deck: Deck): Deck {
		// Use our safe deep clone utility which handles Blobs and other special objects
		return safeDeepClone(deck);
	}

	/**
	 * Create default card template
	 * Uses the first sample card as the single source of truth
	 */
	private createDefaultCard(): Card {
		const sampleCards = getSampleCards();
		const firstCard = sampleCards[0];

		return {
			id: generateKey(),
			title: firstCard.title || 'New Card',
			subtitle: firstCard.subtitle || '',
			description: firstCard.description || '',
			image: firstCard.image || null,
			traits: firstCard.traits || [],
			stats: firstCard.stats || []
		};
	}

	/**
	 * Clear all data (development helper)
	 */
	async clearAll(): Promise<void> {
		const db = await this.ensureInit();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.deckStore], 'readwrite');
			const store = transaction.objectStore(this.deckStore);

			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () =>
				reject(new DatabaseError('Failed to clear database', 'DB_CLEAR_ERROR'));
		});
	}
}

// Singleton instance
export const nextDb = new NextDatabase();
