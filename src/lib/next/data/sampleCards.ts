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
			subtitle: 'This is an Astounding Tutorial',
			description:
				'Free to use (and there is no "premium plan"), no signup, no ads, works offline. All data is stored locally in your browser, so you can keep your cards close to your chest. We DO track shared deck urls (to see which decks are popular) but dont see the contents of shared decks. Also, we don\'t use cookies or want to know your email.',
			image: '/portraits/astounding.jpg',
			traits: [
				{ title: 'Click me', description: 'Click anywhere to open the editor', isPublic: true },
				{ title: 'Do it!', description: 'Just try clicking this card first', isPublic: true },
				{ title: 'Add more', description: 'Click "+ Add Card" in header too', isPublic: true }
			],
			stats: [{ title: 'Step', value: 1, tracked: false, isPublic: true }]
		},
		{
			title: 'Change everything!',
			subtitle: 'Use Edit View to change title, subtitle, description, image, traits and stats.',
			description:
				'Make your cards your own! We made Astounding Cards for roleplaying game props: for keeping track of characters, locations and plot items. But you can make cards for anything. Flashcards, recipes, educational tools, weird playing cards or exceptionally limited trading cards - go for it!',
			image: null,
			traits: [
				{ title: 'Traits', description: 'Great for descriptive properties', isPublic: true },
				{ title: 'Stats', description: "If it's a number, it can be a stat!", isPublic: true },
				{
					title: 'Reorder',
					description: 'Drag by the ⋮⋮ handles to rearrange traits and stats',
					isPublic: false
				},
				{ title: 'Flipside', description: 'Try putting this trait on the front', isPublic: false }
			],
			stats: [
				{ title: 'Step', value: 2, tracked: false, isPublic: true },
				{
					title: 'Answer',
					value: 42,
					tracked: false,
					isPublic: false,
					description: 'Use stats for any numeric value'
				},
				{
					title: 'Back Stat',
					value: 12,
					tracked: true,
					isPublic: false,
					description: 'Back stats can have tracking boxes'
				}
			]
		},
		{
			title: 'AI features',
			subtitle: 'Yes, AI slop is terrible, but...',
			description:
				'Generate whole decks from a simple description, and images from the information already in the card. Or not: using the provided AI tools is entirely up to you. Your cards will probably be even more Astounding if you dont use AI at all!',
			image: null,
			traits: [
				{ title: 'So fast!', description: 'Enter description, get a full deck', isPublic: true },
				{ title: 'AI "art"', description: 'Create or change illustrations', isPublic: true },
				{ title: 'Styles', description: 'Classic, Modern, and Inked', isPublic: true },
				{
					title: 'Your key',
					description: 'Get a key from aistudio.google.com and use it for the AI features',
					isPublic: false
				},
				{
					title: 'Or not',
					description:
						"Actually, you shouldn't paste in your API key on strange websites. But if you can't trust Astounding Cards, then who can you trust?",
					isPublic: false
				}
			],
			stats: [
				{ title: 'Step', value: 3, tracked: false, isPublic: true },
				{
					title: 'Styles',
					value: 3,
					tracked: false,
					isPublic: true,
					description: 'Classic, Modern, and Inked'
				},
				{
					title: 'Optional',
					value: 100,
					tracked: false,
					isPublic: true,
					description: 'Works great without AI too!'
				}
			]
		},
		{
			title: 'Share Your Deck!',
			subtitle: 'Display your deck on the internet.',
			description:
				'Astounding Cards is made for printing, but you can also share decks using the "Share" button in the header. Shareable decks are public and can be viewed by anyone with the link.',
			image: null,
			traits: [
				{ title: 'Share', description: 'Click "Share" for shareable URL', isPublic: true },
				{ title: 'Backup', description: 'Backups can including images', isPublic: true },
				{ title: 'Print', description: 'Print-ready layout', isPublic: true },
				{
					title: 'Delete',
					description: "Remove this deck when you're ready to go solo!",
					isPublic: false
				}
			],
			stats: [
				{ title: 'Step', value: 4, tracked: false, isPublic: true },
				{ title: 'Created', value: 0, tracked: true, isPublic: true }
			]
		}
	];
}
