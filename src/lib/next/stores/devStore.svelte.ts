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
                        { label: 'Profession', value: 'University Professor', isPublic: true },
                        { label: 'Expertise', value: 'Ancient Civilizations', isPublic: true },
                        { label: 'Secret', value: 'Member of the Hermetic Order', isPublic: false },
                        { label: 'Fear', value: 'Enclosed spaces (mild claustrophobia)', isPublic: false }
                    ],
                    stats: [
                        { label: 'Health', value: 18, tracked: true, isPublic: true },
                        { label: 'Sanity', value: 65, tracked: true, isPublic: false, description: 'Mental stability - decreases with exposure to the supernatural' },
                        { label: 'Defense', value: 12, tracked: false, isPublic: true },
                        { label: 'Investigation', value: 85, tracked: false, isPublic: true },
                        { label: 'Connections', value: 70, tracked: false, isPublic: false, description: 'Academic and social network influence' }
                    ]
                },
                {
                    title: 'The Ethereal Compass',
                    subtitle: 'Mystical Device',
                    description: 'An ornate brass compass that points not to magnetic north, but to supernatural phenomena.',
                    traits: [
                        { label: 'Material', value: 'Brass and silver', isPublic: true },
                        { label: 'Condition', value: 'Always warm to the touch', isPublic: true },
                        { label: 'Origin', value: 'Victorian era, unknown craftsman', isPublic: false },
                        { label: 'Curse', value: 'Slowly drains user\'s life force', isPublic: false }
                    ],
                    stats: [
                        { label: 'Value', value: '£1,200', tracked: false, isPublic: false },
                        { label: 'Rarity', value: 'Legendary', tracked: false, isPublic: false },
                        { label: 'Durability', value: 8, tracked: true, isPublic: true, description: 'Physical condition - can be damaged' },
                        { label: 'Charges', value: 15, tracked: true, isPublic: false, description: 'Mystical energy remaining' },
                        { label: 'Detection Range', value: '5 miles', tracked: false, isPublic: true }
                    ]
                },
                {
                    title: 'The Misty Vale',
                    subtitle: 'Haunted Location',
                    description: 'A fog-shrouded valley where time moves differently and the dead do not rest.',
                    traits: [
                        { label: 'Climate', value: 'Perpetually foggy', isPublic: true },
                        { label: 'Terrain', value: 'Rolling hills and ancient stones', isPublic: true },
                        { label: 'History', value: 'Site of a medieval massacre', isPublic: false },
                        { label: 'Phenomena', value: 'Time distortion and spectral manifestations', isPublic: false }
                    ],
                    stats: [
                        { label: 'Danger Level', value: 'Extreme', tracked: false, isPublic: true },
                        { label: 'Visibility', value: '10 feet', tracked: false, isPublic: true },
                        { label: 'Spectral Activity', value: 12, tracked: true, isPublic: false, description: 'Current level of supernatural manifestations' },
                        { label: 'Escape Difficulty', value: 90, tracked: false, isPublic: false },
                        { label: 'Area', value: '3 square miles', tracked: false, isPublic: true }
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
