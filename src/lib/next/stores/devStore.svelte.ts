/**
 * Dev Tools Store for Next System
 * 
 * Development utilities for testing and debugging:
 * - Sample data creation
 * - Database operations
 * - E2E testing helpers
 */

import { nextDb } from './database.js';
import { nextDeckStore } from './deckStore.svelte.js';
import type { Deck, Theme, Layout } from '../types/deck.js';
import type { Card } from '../types/card.js';

/**
 * Create dev tools store
 */
function createNextDevStore() {
    let devMode = $state(false);

    return {
        get isDevMode() { return devMode; },

        /**
         * Enable dev mode
         */
        enableDevMode(): void {
            devMode = true;
        },

        /**
         * Disable dev mode
         */
        disableDevMode(): void {
            devMode = false;
        },

        /**
         * Toggle dev mode
         */
        toggleDevMode(): void {
            devMode = !devMode;
        },

        /**
         * Clear all database data
         */
        async clearDatabase(): Promise<void> {
            await nextDb.clearAll();
            nextDeckStore.clearDeck();
        },

        /**
         * Create sample deck for testing
         */
        async createSampleDeck(): Promise<Deck | null> {
            try {
                const deck = await nextDb.createDeck('Sample Deck', 'classic', 'tarot');
                
                // Add sample cards
                const sampleCards = this.getSampleCards();
                
                for (const cardData of sampleCards) {
                    await nextDb.addCard(deck.id, cardData);
                }

                // Get updated deck with all cards
                const updatedDeck = await nextDb.getDeck(deck.id);
                return updatedDeck;
            } catch (error) {
                console.error('Failed to create sample deck:', error);
                return null;
            }
        },

        /**
         * Setup test environment with sample data
         */
        async setupTestEnvironment(): Promise<boolean> {
            try {
                // Clear existing data
                await this.clearDatabase();
                
                // Create sample deck
                const deck = await this.createSampleDeck();
                if (!deck) return false;

                // Load it in the store
                return await nextDeckStore.loadDeck(deck.id);
            } catch (error) {
                console.error('Failed to setup test environment:', error);
                return false;
            }
        },

        /**
         * Get sample cards for testing
         */
        getSampleCards(): Partial<Card>[] {
            return [
                {
                    title: 'Dr. Evelyn Blackwood',
                    subtitle: 'Archaeologist',
                    description: 'A brilliant scholar with a dangerous curiosity about forbidden knowledge.',
                    traits: [
                        { title: 'Profession', description: 'University Professor', isPublic: true },
                        { title: 'Expertise', description: 'Ancient Civilizations', isPublic: true },
                        { title: 'Secret', description: 'Member of the Hermetic Order', isPublic: false },
                        { title: 'Fear', description: 'Enclosed spaces (mild claustrophobia)', isPublic: false }
                    ],
                    stats: [
                        { title: 'Health', value: 18, tracked: true, isPublic: true },
                        { title: 'Sanity', value: 65, tracked: true, isPublic: false, description: 'Mental stability - decreases with exposure to the supernatural' },
                        { title: 'Defense', value: 12, tracked: false, isPublic: true },
                        { title: 'Investigation', value: 85, tracked: false, isPublic: true },
                        { title: 'Connections', value: 70, tracked: false, isPublic: false, description: 'Academic and social network influence' }
                    ]
                },
                {
                    title: 'The Ethereal Compass',
                    subtitle: 'Mystical Device',
                    description: 'An ornate brass compass that points not to magnetic north, but to supernatural phenomena.',
                    traits: [
                        { title: 'Material', description: 'Brass and silver', isPublic: true },
                        { title: 'Condition', description: 'Always warm to the touch', isPublic: true },
                        { title: 'Origin', description: 'Victorian era, unknown craftsman', isPublic: false },
                        { title: 'Curse', description: 'Slowly drains user\'s life force', isPublic: false }
                    ],
                    stats: [
                        { title: 'Value', value: 1200, tracked: false, isPublic: false },
                        { title: 'Rarity', value: 9, tracked: false, isPublic: false, description: 'Legendary (9/10 scale)' },
                        { title: 'Durability', value: 8, tracked: true, isPublic: true, description: 'Physical condition - can be damaged' },
                        { title: 'Charges', value: 15, tracked: true, isPublic: false, description: 'Mystical energy remaining' },
                        { title: 'Detection Range', value: 5, tracked: false, isPublic: true, description: '5 miles detection range' }
                    ]
                },
                {
                    title: 'The Misty Vale',
                    subtitle: 'Haunted Location',
                    description: 'A fog-shrouded valley where time moves differently and the dead do not rest.',
                    traits: [
                        { title: 'Climate', description: 'Perpetually foggy', isPublic: true },
                        { title: 'Terrain', description: 'Rolling hills and ancient stones', isPublic: true },
                        { title: 'History', description: 'Site of a medieval massacre', isPublic: false },
                        { title: 'Phenomena', description: 'Time distortion and spectral manifestations', isPublic: false }
                    ],
                    stats: [
                        { title: 'Danger Level', value: 9, tracked: false, isPublic: true, description: 'Extreme danger (9/10 scale)' },
                        { title: 'Visibility', value: 10, tracked: false, isPublic: true, description: '10 feet visibility range' },
                        { title: 'Spectral Activity', value: 12, tracked: true, isPublic: false, description: 'Current level of supernatural manifestations' },
                        { title: 'Escape Difficulty', value: 90, tracked: false, isPublic: false },
                        { title: 'Area', value: 3, tracked: false, isPublic: true, description: '3 square miles coverage' }
                    ]
                }
            ];
        },

        /**
         * Get database info for debugging
         */
        async getDatabaseInfo(): Promise<{ deckCount: number; totalCards: number }> {
            try {
                const decks = await nextDb.getAllDecks();
                const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
                
                return {
                    deckCount: decks.length,
                    totalCards
                };
            } catch (error) {
                console.error('Failed to get database info:', error);
                return { deckCount: 0, totalCards: 0 };
            }
        },

        /**
         * Export current deck as JSON (for debugging)
         */
        exportCurrentDeck(): string | null {
            const deck = nextDeckStore.deck;
            if (!deck) return null;
            
            return JSON.stringify(deck, null, 2);
        }
    };
}

export const nextDevStore = createNextDevStore();

// Make available globally for console access (development only)
if (typeof window !== 'undefined') {
    (window as any).nextDevTools = {
        enableDevMode: () => nextDevStore.enableDevMode(),
        disableDevMode: () => nextDevStore.disableDevMode(),
        clearDatabase: () => nextDevStore.clearDatabase(),
        setupTestEnvironment: () => nextDevStore.setupTestEnvironment(),
        createSampleDeck: () => nextDevStore.createSampleDeck(),
        getDatabaseInfo: () => nextDevStore.getDatabaseInfo(),
        exportDeck: () => nextDevStore.exportCurrentDeck(),
        store: nextDeckStore
    };
}
