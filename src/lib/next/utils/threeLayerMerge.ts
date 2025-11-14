/**
 * Three-Layer Merge System
 * 
 * Merges deck data from three sources in priority order:
 * 1. Curated Deck (Supabase) - Base layer
 * 2. Hash Data (URL) - Shared modifications
 * 3. Local Deck (IndexedDB) - Highest priority (user's changes)
 * 
 * Priority: Local > Hash > Curated
 */

import type { Deck } from '../types/deck.js';
import { detectDeckConflict, type DeckConflict } from './deckMerging.js';

export interface ThreeLayerMergeResult {
	/** The final merged deck */
	deck: Deck;
	
	/** Whether a conflict was detected with local changes */
	hasConflict: boolean;
	
	/** Conflict details if hasConflict is true */
	conflict?: DeckConflict;
	
	/** Which layers were present in the merge */
	layers: {
		curated: boolean;
		hash: boolean;
		local: boolean;
	};
}

/**
 * Convert published deck format to internal Deck format
 */
function convertPublishedDeckToDeck(publishedDeck: any): Deck {
	return {
		id: publishedDeck.id,
		meta: {
			title: publishedDeck.title,
			theme: publishedDeck.theme || 'classic',
			description: publishedDeck.description || '',
			tags: publishedDeck.tags || [],
			createdAt: publishedDeck.created_at,
			updatedAt: publishedDeck.updated_at
		},
		cards: publishedDeck.cards,
		statblockConfig: null // Published decks don't have custom configs yet
	};
}

/**
 * Perform three-layer merge
 * 
 * @param curatedDeck - Deck from Supabase (base layer)
 * @param hashDeck - Deck from URL hash (shared modifications)
 * @param localDeck - Deck from IndexedDB (highest priority)
 * @returns Merge result with final deck and conflict info
 */
export function performThreeLayerMerge(
	curatedDeck: any | null,
	hashDeck: Deck | null,
	localDeck: Deck | null
): ThreeLayerMergeResult {
	// Track which layers are present
	const layers = {
		curated: !!curatedDeck,
		hash: !!hashDeck,
		local: !!localDeck
	};

	// Start with the base layer (curated or hash)
	let baseDeck: Deck;
	
	if (curatedDeck) {
		// Convert published deck format to internal Deck format
		baseDeck = convertPublishedDeckToDeck(curatedDeck);
	} else if (hashDeck) {
		baseDeck = hashDeck;
	} else {
		// No data at all - shouldn't happen but handle gracefully
		throw new Error('No deck data provided for merge');
	}

	// Layer 2: Apply hash modifications if present
	if (curatedDeck && hashDeck) {
		// Hash deck modifies curated deck
		// For now, hash data completely replaces curated deck
		// (Future: could do smarter field-level merging)
		baseDeck = {
			...baseDeck,
			...hashDeck,
			// Keep the curated deck's ID if hash deck has the same ID
			id: hashDeck.id === baseDeck.id ? baseDeck.id : hashDeck.id
		};
	}

	// Layer 3: Check for local deck (highest priority)
	if (localDeck) {
		// Detect if there's a conflict between the merged base and local version
		const conflict = detectDeckConflict(localDeck, baseDeck);
		
		if (conflict) {
			// There's a conflict - return both versions for user to resolve
			return {
				deck: localDeck, // Default to local version
				hasConflict: true,
				conflict,
				layers
			};
		} else {
			// No conflict, local version wins
			return {
				deck: localDeck,
				hasConflict: false,
				layers
			};
		}
	}

	// No local deck, return the merged base (curated + hash)
	return {
		deck: baseDeck,
		hasConflict: false,
		layers
	};
}

/**
 * Check if a URL has curated deck parameter
 */
export function hasCuratedParam(url: URL): boolean {
	return url.searchParams.has('curated');
}

/**
 * Get curated deck ID from URL
 */
export function getCuratedId(url: URL): string | null {
	return url.searchParams.get('curated');
}

/**
 * Build URL for sharing a curated deck with modifications
 */
export function buildCuratedShareUrl(
	curatedId: string,
	baseUrl: string = typeof window !== 'undefined' ? window.location.origin : '',
	hashData?: string
): string {
	const url = new URL(`/deck-viewer?curated=${curatedId}`, baseUrl);
	
	if (hashData) {
		url.hash = hashData;
	}
	
	return url.toString();
}
