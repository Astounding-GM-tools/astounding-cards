import type { Card } from '../types/card';

/**
 * Transforms gallery deck metadata into a Card object for display
 * This allows us to display decks as cards in the gallery (deck-ception!)
 */
export function deckToCard(deck: {
	id: string;
	slug: string;
	title: string;
	description?: string;
	theme?: string;
	tags?: string[];
	cardCount: number;
	view_count?: number;
	import_count?: number;
	like_count?: number;
	creator_name?: string;
	is_featured?: boolean;
	is_curated?: boolean;
	firstCardImage?: string | null;
}): Card {
	// Build stats array
	const stats: Card['stats'] = [
		{
			title: 'Cards',
			value: deck.cardCount,
			tracked: false,
			isPublic: true
		}
	];

	if (deck.view_count !== undefined && deck.view_count > 0) {
		stats.push({
			title: 'Views',
			value: deck.view_count,
			tracked: false,
			isPublic: true
		});
	}

	if (deck.import_count !== undefined && deck.import_count > 0) {
		stats.push({
			title: 'Imports',
			value: deck.import_count,
			tracked: false,
			isPublic: true
		});
	}

	if (deck.like_count !== undefined && deck.like_count > 0) {
		stats.push({
			title: 'Likes',
			value: deck.like_count,
			tracked: false,
			isPublic: true
		});
	}

	// Build traits array from tags and metadata
	const traits: Card['traits'] = [];

	if (deck.creator_name) {
		traits.push({
			title: 'Creator',
			description: deck.creator_name,
			isPublic: true
		});
	}

	if (deck.theme) {
		traits.push({
			title: 'Theme',
			description: deck.theme.charAt(0).toUpperCase() + deck.theme.slice(1),
			isPublic: true
		});
	}

	// Add tags as traits
	if (deck.tags && deck.tags.length > 0) {
		for (const tag of deck.tags) {
			traits.push({
				title: tag,
				description: '',
				isPublic: true
			});
		}
	}

	// Add badges as hidden traits
	if (deck.is_featured) {
		traits.push({
			title: '⭐ Featured',
			description: 'This deck is featured by the community',
			isPublic: false
		});
	}

	if (deck.is_curated) {
		traits.push({
			title: '✓ Curated',
			description: 'This deck is curated by the Astounding Cards team',
			isPublic: false
		});
	}

	// Create the card object
	return {
		id: deck.id,
		title: deck.title,
		subtitle: deck.creator_name || 'Community Deck',
		description: deck.description || 'No description provided',
		image: deck.firstCardImage || null,
		imageBlob: null,
		imageMetadata: deck.firstCardImage
			? {
					source: 'url',
					addedAt: Date.now()
				}
			: null,
		stats,
		traits
	};
}
