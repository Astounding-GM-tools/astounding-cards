/**
 * Share URL Types and Property Mappings
 *
 * Optimized format for encoding decks in URLs:
 * - Deck level: Human readable property names
 * - Card level: Shortened property names for space efficiency
 * - Default value omission: Skip properties that match defaults
 * - Presence flags: Use property presence instead of boolean values
 */

import type { Deck, Card, Theme, Layout, Trait, Stat } from './deck.js';

// =============================================================================
// SHAREABLE FORMAT TYPES
// =============================================================================

/**
 * Deck format for sharing - human readable keys, defaults omitted
 */
export interface ShareableDeck {
	id: string;
	title: string;
	description?: string; // Optional field
	theme?: Theme; // Omit if "classic" (default)
	layout?: Layout; // Omit if "tarot" (default)
	cards: ShareableCard[];
}

/**
 * Card format for sharing - shortened keys, defaults omitted
 */
export interface ShareableCard {
	i: string; // id
	t: string; // title
	s: string; // subtitle
	d: string; // description
	img?: string; // image (optional)
	tr?: ShareableTrait[]; // traits (omit if empty)
	st?: ShareableStat[]; // stats (omit if empty)
}

/**
 * Trait format for sharing - shortened keys, presence flags
 */
export interface ShareableTrait {
	t: string; // title
	d: string; // description
	p?: true; // isPublic flag - only present if true (default: false/secret)
}

/**
 * Stat format for sharing - shortened keys, presence flags
 */
export interface ShareableStat {
	t: string; // title
	v: number; // value
	p?: true; // isPublic flag - only present if true (default: false/secret)
	tr?: true; // tracked flag - only present if true (default: false/untracked)
	d?: string; // description (optional)
}

// =============================================================================
// PROPERTY NAME MAPPINGS
// =============================================================================

/**
 * Card property name mappings: Full name → Shortened name
 */
export const CARD_PROPERTY_MAP = {
	id: 'i',
	title: 't',
	subtitle: 's',
	description: 'd',
	image: 'img',
	traits: 'tr',
	stats: 'st'
} as const;

/**
 * Trait property name mappings: Full name → Shortened name
 */
export const TRAIT_PROPERTY_MAP = {
	title: 't',
	description: 'd',
	isPublic: 'p' // Note: becomes presence flag
} as const;

/**
 * Stat property name mappings: Full name → Shortened name
 */
export const STAT_PROPERTY_MAP = {
	title: 't',
	value: 'v',
	isPublic: 'p', // Note: becomes presence flag
	tracked: 'tr', // Note: becomes presence flag
	description: 'd'
} as const;

/**
 * Default values - these are omitted from the shareable format
 */
export const DEFAULTS = {
	THEME: 'classic' as Theme,
	LAYOUT: 'tarot' as Layout,
	IS_PUBLIC: false,
	IS_TRACKED: false
} as const;

// =============================================================================
// CONVERSION UTILITIES (TYPE HELPERS)
// =============================================================================

/**
 * Type helper: Extract shortened property keys
 */
export type ShortenedCardKey = (typeof CARD_PROPERTY_MAP)[keyof typeof CARD_PROPERTY_MAP];
export type ShortenedTraitKey = (typeof TRAIT_PROPERTY_MAP)[keyof typeof TRAIT_PROPERTY_MAP];
export type ShortenedStatKey = (typeof STAT_PROPERTY_MAP)[keyof typeof STAT_PROPERTY_MAP];

/**
 * Type helper: Reverse mappings for import
 */
export type CardKeyReverse = {
	[K in ShortenedCardKey]: {
		[P in keyof typeof CARD_PROPERTY_MAP]: (typeof CARD_PROPERTY_MAP)[P] extends K ? P : never;
	}[keyof typeof CARD_PROPERTY_MAP];
};

export type TraitKeyReverse = {
	[K in ShortenedTraitKey]: {
		[P in keyof typeof TRAIT_PROPERTY_MAP]: (typeof TRAIT_PROPERTY_MAP)[P] extends K ? P : never;
	}[keyof typeof TRAIT_PROPERTY_MAP];
};

export type StatKeyReverse = {
	[K in ShortenedStatKey]: {
		[P in keyof typeof STAT_PROPERTY_MAP]: (typeof STAT_PROPERTY_MAP)[P] extends K ? P : never;
	}[keyof typeof STAT_PROPERTY_MAP];
};

// =============================================================================
// EXAMPLE USAGE (for documentation)
// =============================================================================

/**
 * Example of how the format looks:
 *
 * Full Deck → Shareable Format:
 *
 * ```json
 * {
 *   "id": "deck-123",
 *   "title": "My Campaign",
 *   "description": "Epic adventure",
 *   // theme omitted (classic = default)
 *   // layout omitted (tarot = default)
 *   "cards": [
 *     {
 *       "i": "card-456",
 *       "t": "Gandalf",
 *       "s": "Wizard",
 *       "d": "Wise and powerful",
 *       "img": "https://example.com/gandalf.jpg",
 *       "tr": [
 *         {"t": "Magical", "d": "Has spells", "p": true}, // public
 *         {"t": "Secret", "d": "Hidden past"}             // secret (no 'p' flag)
 *       ],
 *       "st": [
 *         {"t": "Wisdom", "v": 18, "p": true, "tr": true, "d": "Mental power"}, // public, tracked
 *         {"t": "Health", "v": 100}                                             // secret, untracked
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Space savings:
 * - Shortened card keys: ~40% reduction in property names
 * - Default omission: ~20% reduction in deck metadata
 * - Presence flags: ~30% reduction in boolean fields
 * - Overall: ~50-60% smaller URLs
 */
