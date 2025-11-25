/**
 * Share URL Conversion Utilities
 *
 * Converts between full deck format and optimized shareable format:
 * - toShareable(): Full Deck → ShareableDeck (for URL generation)
 * - fromShareable(): ShareableDeck → Full Deck (for import)
 */

import type { Deck, Card, Trait, Stat } from '../types/deck.js';
import type {
	ShareableDeck,
	ShareableCard,
	ShareableTrait,
	ShareableStat
} from '../types/shareUrl.js';
import {
	CARD_PROPERTY_MAP,
	TRAIT_PROPERTY_MAP,
	STAT_PROPERTY_MAP,
	DEFAULTS
} from '../types/shareUrl.js';

// =============================================================================
// EXPORT FUNCTIONS (Full → Shareable)
// =============================================================================

/**
 * Convert a full deck to shareable format for URL encoding
 */
export function toShareable(deck: Deck): ShareableDeck {
	// Start with human-readable content first
	const shareable: ShareableDeck = {
		title: deck.meta.title,
		id: deck.id,
		cards: deck.cards.map(toShareableCard)
	};

	// Add description right after title if present
	if (deck.meta.description) {
		shareable.description = deck.meta.description;
	}

	// Add technical settings after human content
	if (deck.meta.theme !== DEFAULTS.THEME) {
		shareable.theme = deck.meta.theme;
	}

	if (deck.meta.layout !== DEFAULTS.LAYOUT) {
		shareable.layout = deck.meta.layout;
	}

	return shareable;
}

/**
 * Convert a full card to shareable format
 */
function toShareableCard(card: Card): ShareableCard {
	const shareable: ShareableCard = {
		i: card.id,
		t: card.title,
		s: card.subtitle,
		d: card.description
	};

	// Optional fields
	if (card.image) {
		shareable.img = card.image;
	}

	if (card.traits && card.traits.length > 0) {
		shareable.tr = card.traits.map(toShareableTrait);
	}

	if (card.stats && card.stats.length > 0) {
		shareable.st = card.stats.map(toShareableStat);
	}

	return shareable;
}

/**
 * Convert a full trait to shareable format
 */
function toShareableTrait(trait: Trait): ShareableTrait {
	const shareable: ShareableTrait = {
		t: trait.title,
		d: trait.description
	};

	// Only add presence flag if true (omit default false)
	if (trait.isPublic) {
		shareable.p = true;
	}

	return shareable;
}

/**
 * Convert a full stat to shareable format
 */
function toShareableStat(stat: Stat): ShareableStat {
	const shareable: ShareableStat = {
		t: stat.title,
		v: stat.value
	};

	// Only add presence flags if true (omit default false)
	if (stat.isPublic) {
		shareable.p = true;
	}

	if (stat.tracked) {
		shareable.tr = true;
	}

	// Optional description
	if (stat.description) {
		shareable.d = stat.description;
	}

	return shareable;
}

// =============================================================================
// IMPORT FUNCTIONS (Shareable → Full)
// =============================================================================

/**
 * Convert shareable deck format back to full deck (for import)
 * Generates new timestamps and applies defaults for missing values
 */
export function fromShareable(shareable: ShareableDeck): Deck {
	const now = Date.now();

	return {
		id: shareable.id, // Preserve original ID for merge functionality
		meta: {
			title: shareable.title,
			description: shareable.description || '',
			theme: shareable.theme || DEFAULTS.THEME,
			layout: shareable.layout || DEFAULTS.LAYOUT,
			lastEdited: now,
			createdAt: now
		},
		cards: shareable.cards.map(fromShareableCard)
	};
}

/**
 * Convert shareable card back to full card format
 */
function fromShareableCard(shareable: ShareableCard): Card {
	return {
		id: shareable.i, // Preserve original ID for merge functionality
		title: shareable.t,
		subtitle: shareable.s,
		description: shareable.d,
		image: shareable.img || null,
		imageBlob: null, // Always null for imported cards
		imageMetadata: shareable.img
			? {
					source: 'url',
					addedAt: Date.now()
				}
			: null,
		traits: shareable.tr ? shareable.tr.map(fromShareableTrait) : [],
		stats: shareable.st ? shareable.st.map(fromShareableStat) : []
	};
}

/**
 * Convert shareable trait back to full trait format
 */
function fromShareableTrait(shareable: ShareableTrait): Trait {
	return {
		title: shareable.t,
		description: shareable.d,
		isPublic: shareable.p === true // true if present, false if absent (default)
	};
}

/**
 * Convert shareable stat back to full stat format
 */
function fromShareableStat(shareable: ShareableStat): Stat {
	return {
		title: shareable.t,
		value: shareable.v,
		isPublic: shareable.p === true, // true if present, false if absent (default)
		tracked: shareable.tr === true, // true if present, false if absent (default)
		description: shareable.d || ''
	};
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Estimate the size of a shareable deck when JSON stringified
 */
export function estimateShareableSize(deck: Deck): {
	original: number;
	shareable: number;
	savings: number;
} {
	const originalJson = JSON.stringify(deck);
	const shareableJson = JSON.stringify(toShareable(deck));

	return {
		original: originalJson.length,
		shareable: shareableJson.length,
		savings: Math.round((1 - shareableJson.length / originalJson.length) * 100)
	};
}

/**
 * Validate that a round-trip conversion preserves essential data
 * (Useful for testing)
 */
export function validateRoundTrip(original: Deck): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	try {
		const shareable = toShareable(original);
		const restored = fromShareable(shareable);

		// Check deck metadata (ignoring timestamps)
		if (restored.id !== original.id) errors.push('Deck ID mismatch');
		if (restored.meta.title !== original.meta.title) errors.push('Title mismatch');
		if (restored.meta.theme !== original.meta.theme) errors.push('Theme mismatch');
		if (restored.meta.layout !== original.meta.layout) errors.push('Layout mismatch');

		// Check cards
		if (restored.cards.length !== original.cards.length) {
			errors.push('Card count mismatch');
		} else {
			original.cards.forEach((originalCard, index) => {
				const restoredCard = restored.cards[index];
				if (restoredCard.id !== originalCard.id) errors.push(`Card ${index} ID mismatch`);
				if (restoredCard.title !== originalCard.title) errors.push(`Card ${index} title mismatch`);
				if (restoredCard.traits.length !== originalCard.traits.length)
					errors.push(`Card ${index} traits count mismatch`);
				if (restoredCard.stats.length !== originalCard.stats.length)
					errors.push(`Card ${index} stats count mismatch`);
			});
		}
	} catch (err) {
		errors.push(`Conversion error: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}
