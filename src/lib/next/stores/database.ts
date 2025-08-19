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
     * Removes non-cloneable properties like Proxy objects and Blobs
     */
    private sanitizeDeckForStorage(deck: Deck): Deck {
        // Use JSON parse/stringify to strip Proxy wrappers and create plain objects
        // This is the most reliable way to remove Svelte's reactive Proxy objects
        const jsonString = JSON.stringify(deck, (key, value) => {
            // Filter out non-serializable properties during JSON.stringify
            if (key === 'imageBlob') return undefined; // Remove Blob objects
            if (typeof value === 'function') return undefined; // Remove functions
            return value;
        });
        
        const plainDeck: Deck = JSON.parse(jsonString);
        
        // Ensure data integrity after JSON round-trip
        return {
            ...plainDeck,
            cards: plainDeck.cards.map(card => ({
                id: card.id || crypto.randomUUID(),
                title: card.title || '',
                subtitle: card.subtitle || '',
                description: card.description || '',
                image: card.image || null,
                stats: (card.stats || []).map(stat => ({
                    title: stat.title || '',
                    isPublic: stat.isPublic ?? true,
                    value: typeof stat.value === 'number' ? stat.value : 0,
                    tracked: stat.tracked ?? false,
                    description: stat.description || ''
                })),
                traits: (card.traits || []).map(trait => ({
                    title: trait.title || '',
                    isPublic: trait.isPublic ?? true,
                    description: trait.description || ''
                }))
            }))
        };
    }
    
    /**
     * Debug helper to detect non-cloneable objects
     */
    private debugCloneableCheck(obj: any, path: string = 'deck'): void {
        try {
            // Try to clone the object to see if it would fail
            structuredClone(obj);
        } catch (error) {
            console.error(`Non-cloneable object detected at ${path}:`, error);
            console.error('Object causing issues:', obj);
            
            // Check for common non-cloneable properties
            if (typeof obj === 'object' && obj !== null) {
                for (const [key, value] of Object.entries(obj)) {
                    if (value instanceof Blob) {
                        console.warn(`Found Blob at ${path}.${key}`); 
                    } else if (typeof value === 'function') {
                        console.warn(`Found function at ${path}.${key}`);
                    } else if (value && typeof value === 'object') {
                        // Recursively check nested objects (but avoid infinite loops)
                        if (!path.includes('.cards.') || key !== 'cards') {
                            this.debugCloneableCheck(value, `${path}.${key}`);
                        }
                    }
                }
            }
        }
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
                { title: 'Race', isPublic: true, description: 'Human heritage with adaptable nature' },
                { title: 'Class', isPublic: true, description: 'Skilled in stealth and precision' }
            ],
            stats: [
                { title: 'Health', isPublic: true, value: 20, tracked: true, description: 'Physical condition and endurance' },
                { title: 'Defense', isPublic: true, value: 15, tracked: false, description: 'Ability to avoid or reduce damage' },
                { title: 'Luck', isPublic: false, value: 12, tracked: true }
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
