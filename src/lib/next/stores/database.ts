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

import type { Deck, Layout, Theme } from '../types/deck.js';
import type { Card } from '../types/card.js';

export class DatabaseError extends Error {
    constructor(message: string, public code: string) {
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
    async createDeck(title: string, theme: Theme = 'classic', layout: Layout = 'tarot'): Promise<Deck> {
        const db = await this.ensureInit();
        const now = Date.now();
        
        const deck: Deck = {
            id: crypto.randomUUID(),
            meta: {
                title,
                theme,
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
            request.onerror = () => reject(new DatabaseError('Failed to create deck', 'DECK_CREATE_ERROR'));
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
            request.onerror = () => reject(new DatabaseError('Failed to get all decks', 'DECKS_GET_ERROR'));
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

        const updatedDeck: Deck = {
            ...deck,
            meta: {
                ...deck.meta,
                ...updates,
                lastEdited: Date.now()
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

        const cardIndex = deck.cards.findIndex(c => c.id === cardId);
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
            cards: deck.cards.filter(c => c.id !== cardId),
            meta: {
                ...deck.meta,
                lastEdited: Date.now()
            }
        };

        return this.saveDeck(updatedDeck);
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
            request.onerror = () => reject(new DatabaseError('Failed to delete deck', 'DECK_DELETE_ERROR'));
        });
    }

    /**
     * Save deck (internal helper)
     */
    private async saveDeck(deck: Deck): Promise<Deck> {
        const db = await this.ensureInit();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.deckStore], 'readwrite');
            const store = transaction.objectStore(this.deckStore);
            
            const request = store.put(deck);
            
            request.onsuccess = () => resolve(deck);
            request.onerror = () => reject(new DatabaseError('Failed to save deck', 'DECK_SAVE_ERROR'));
        });
    }

    /**
     * Create default card template
     */
    private createDefaultCard(): Card {
        return {
            id: crypto.randomUUID(),
            title: 'New Card',
            subtitle: 'Character',
            description: 'A mysterious figure from the shadows.',
            image: null,
            traits: [
                { label: 'Race', value: 'Human', isPublic: true },
                { label: 'Class', value: 'Rogue', isPublic: true }
            ],
            stats: [
                { label: 'Health', value: 20, tracked: true, isPublic: true },
                { label: 'Defense', value: 15, tracked: false, isPublic: true },
                { label: 'Notes', value: 'Favors stealth over direct confrontation.', tracked: false, isPublic: false }
            ]
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
            request.onerror = () => reject(new DatabaseError('Failed to clear database', 'DB_CLEAR_ERROR'));
        });
    }
}

// Singleton instance
export const nextDb = new NextDatabase();
