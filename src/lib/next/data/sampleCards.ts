/**
 * Sample Cards Data
 * 
 * Single source of truth for tutorial/sample card content.
 * Used by both devStore and database to ensure consistency.
 */

import type { Card } from '../types/card.js';

/**
 * Get sample cards for testing and tutorials
 */
export function getSampleCards(): Partial<Card>[] {
    return [
        {
            title: 'Create Astounding Cards!',
            subtitle: 'The Astounding Tutorial',
            description: 'Make beautiful, printable cards for any purpose! Free, no signup, works offline. Click anywhere on this card to start.',
            traits: [
                { title: 'Click me', description: 'Click anywhere to open the editor', isPublic: true },
                { title: 'Start simple', description: 'Just try clicking this card first', isPublic: true },
                { title: 'Add more later', description: 'Use "+Add Card" in header', isPublic: true }
            ],
            stats: [
                { title: 'Step', value: 1, tracked: false, isPublic: true }
            ]
        },
        {
            title: 'Change everything!',
            subtitle: 'Use Edit View to change title, subtitle, description, image, traits and stats.',
            description: 'In the editor: Add traits (appear on front/back), stats with values, and images. Drag to reorder items. Toggle "Front/Back" to control visibility.',
            traits: [
                { title: 'Traits', description: 'These appear on the front of the card', isPublic: true },
                { title: 'Stats', description: 'Numeric values can be tracked on the back of the card', isPublic: true },
                { title: 'Drag and drop', description: 'Drag by the ⋮⋮ handles to rearrange traits and stats', isPublic: false },
                { title: 'Flipside', description: 'Try putting this trait on the front of the card!', isPublic: false }

            ],
            stats: [
                { title: 'Step', value: 2, tracked: false, isPublic: true },
                { title: 'Answer', value: 42, tracked: false, isPublic: false, description: 'Use stats for any numeric value' },
                { title: 'Back Stat', value: 12, tracked: true, isPublic: false, description: 'Back stats can have tracking boxes' }
            ]
        },
        {
            title: 'AI features',
            subtitle: 'Yes, AI slop is terrible, but...',
            description: 'You can generate whole decks from a simple description, and even generate AI images for each card.',
            traits: [
                { title: 'AI Images', description: 'Generate card images from descriptions', isPublic: true },
                { title: 'Generate cards', description: 'Use "Generate Images" to do all cards at once', isPublic: true },
                { title: 'Multiple Styles', description: 'Classic, Modern, and Inked art styles', isPublic: false },
                { title: 'Use your own key', description: 'Get a free key from aistudio.google.com and use it to generate cards and images', isPublic: false },
                { title: 'Or not', description: 'Actually, you shouldn\'t give out your API key to strange websites. But if you can\'t trust Astounding Cards, then who can you trust?', isPublic: true }
            ],
            stats: [
                { title: 'Step', value: 3, tracked: false, isPublic: true },
                { title: 'Styles', value: 3, tracked: false, isPublic: true, description: 'Classic, Modern, and Inked' },
                { title: 'Optional', value: 100, tracked: false, isPublic: true, description: 'Works great without AI too!' }
            ]
        },
        {
            title: 'Share Your Deck!',
            subtitle: 'We know you love sharing decks on the internet!',
            description: 'Astounding Cards is made for printing, but you can also share decks using the "Share" button in the header. Shareable decks are public and can be viewed by anyone with the link.',
            traits: [
                { title: 'Unlimited Decks', description: 'Use "Manage Decks" → "Create New Deck"', isPublic: true },
                { title: 'Share Your Deck', description: 'Use "Share" button to create shareable URLs', isPublic: true },
                { title: 'Share Backup', description: "Save a full backup of a deck (including images), and share it if you like. We won't judge!", isPublic: true },
                { title: 'Print Ready', description: 'Just Ctrl+P (or ⌘+P) for print-ready layouts', isPublic: true },
                { title: 'Delete Tutorial', description: 'Remove this deck when you\'re ready to go solo!', isPublic: false }
            ],
            stats: [
                { title: 'Step', value: 4, tracked: false, isPublic: true },
                { title: 'Created', value: 0, tracked: true, isPublic: true }
            ]
        }
    ];
}