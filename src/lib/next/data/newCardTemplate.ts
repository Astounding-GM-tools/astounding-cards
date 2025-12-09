/**
 * Default template for new cards
 *
 * This content is used when adding a new card to a deck.
 * Separate from sample cards to avoid coupling tutorial content with default cards.
 */

import type { Card } from '../types/card.js';

/**
 * Get the default template for a new card
 */
export function getNewCardTemplate(): Partial<Card> {
	return {
		title: 'New Card',
		subtitle: 'Add your own content',
		description:
			'Click the Edit button to open the editor. Customize the title, description, traits, and stats to make this card your own!',
		image: null,
		traits: [
			{
				title: 'Flexible',
				description: 'Cards can represent characters, items, locations, or anything you imagine',
				isPublic: true
			},
			{
				title: 'Printable',
				description: 'Designed for double-sided A4 printing',
				isPublic: true
			}
		],
		stats: [
			{
				title: 'Value',
				value: 1,
				tracked: false,
				isPublic: true,
				description: 'Stats track numeric properties'
			}
		]
	};
}
