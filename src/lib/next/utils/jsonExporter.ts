/**
 * JSON Export Utilities
 *
 * Exports decks in full, human-readable JSON format using existing Deck types.
 * This format is designed to be:
 * - AI-friendly for ChatGPT/Claude deck generation
 * - Human-readable for manual editing
 * - Complete with all metadata and properties
 * - Easy to validate and work with
 */

import type { Deck, Card, Trait, Stat } from '../types/deck.js';
import { createDeckFilename } from './slugUtils.js';

// =============================================================================
// BLOB UTILITIES
// =============================================================================

/**
 * Convert a Blob to a base64 data URL synchronously
 * Note: This uses FileReader which is async, but we'll handle it in the export process
 */
function blobToDataUrl(blob: Blob): string {
	// For now, return a placeholder that will be replaced during async processing
	// This is a synchronous placeholder - we'll need to make the export async
	return `data:${blob.type};base64,PLACEHOLDER_FOR_${blob.size}_BYTES`;
}

/**
 * Convert a Blob to a base64 data URL asynchronously
 */
function blobToDataUrlAsync(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

// =============================================================================
// EXPORT WRAPPER TYPE
// =============================================================================

/**
 * JSON export wrapper with metadata
 */
export interface JsonExport {
	deck: Deck;
	blobs?: Record<string, BlobData>;
	exportMeta: {
		exportedAt: number;
		exportVersion: string;
		source: string;
	};
}

/**
 * Blob data structure for separated image storage
 */
export interface BlobData {
	data: string; // base64 data URL
	metadata?: {
		filename?: string;
		size?: number;
		type?: string;
		lastModified?: number;
	};
}

// =============================================================================
// EXPORT FUNCTIONS
// =============================================================================

/**
 * Export deck as wrapped JSON format with export metadata (async for image processing)
 */
export async function exportDeckToJson(
	deck: Deck,
	includeBlobs: boolean = false
): Promise<JsonExport> {
	if (!includeBlobs) {
		// Light export - just URLs, no blob processing
		const cleanedCards = deck.cards.map(cleanCardLight);

		const cleanDeck: Deck = {
			id: deck.id,
			meta: {
				title: deck.meta.title,
				description: deck.meta.description || '',
				theme: deck.meta.theme,
				layout: deck.meta.layout,
				lastEdited: deck.meta.lastEdited,
				createdAt: deck.meta.createdAt
			},
			cards: cleanedCards
		};

		return {
			deck: cleanDeck,
			exportMeta: {
				exportedAt: Date.now(),
				exportVersion: '1.0.0',
				source: 'https://cards.astounding.games'
			}
		};
	}

	// Complete export with blob separation and deduplication
	const blobRegistry = new Map<string, string>(); // blobKey -> blobId
	const blobs: Record<string, BlobData> = {};

	// Process cards with async image conversion and deduplication
	const cleanedCards = await Promise.all(
		deck.cards.map((card) => cleanCardWithBlobSeparation(card, blobRegistry, blobs))
	);

	const cleanDeck: Deck = {
		id: deck.id,
		meta: {
			title: deck.meta.title,
			description: deck.meta.description || '',
			theme: deck.meta.theme,
			layout: deck.meta.layout,
			lastEdited: deck.meta.lastEdited,
			createdAt: deck.meta.createdAt
		},
		cards: cleanedCards
	};

	const result: JsonExport = {
		deck: cleanDeck,
		exportMeta: {
			exportedAt: Date.now(),
			exportVersion: '1.0.0',
			source: 'https://cards.astounding.games'
		}
	};

	// Only include blobs if we have any
	if (Object.keys(blobs).length > 0) {
		result.blobs = blobs;
	}

	return result;
}

/**
 * Create a clean copy of a card for light export (URLs only)
 */
function cleanCardLight(card: Card): Card {
	const cleanedCard: Card = {
		id: card.id,
		title: card.title,
		subtitle: card.subtitle,
		description: card.description,
		traits: card.traits.map(cleanTrait),
		stats: card.stats.map(cleanStat)
	};

	// Only include image URLs, no blobs
	if (card.image) {
		cleanedCard.image = card.image;
	}

	return cleanedCard;
}

/**
 * Create a clean copy of a card with blob separation and deduplication
 */
async function cleanCardWithBlobSeparation(
	card: Card,
	blobRegistry: Map<string, string>,
	blobs: Record<string, BlobData>
): Promise<Card> {
	const cleanedCard: Card = {
		id: card.id,
		title: card.title,
		subtitle: card.subtitle,
		description: card.description,
		traits: card.traits.map(cleanTrait),
		stats: card.stats.map(cleanStat)
	};

	// Handle image data with blob separation
	if (card.imageBlob) {
		try {
			// Create a key for deduplication (based on blob properties)
			const blobKey = `${card.imageBlob.size}-${card.imageBlob.type}-${card.image || ''}`;

			let blobId = blobRegistry.get(blobKey);

			if (!blobId) {
				// New blob - convert and store
				const dataUrl = await blobToDataUrlAsync(card.imageBlob);
				blobId = `blob-${Object.keys(blobs).length + 1}`;

				blobs[blobId] = {
					data: dataUrl,
					metadata: card.imageMetadata
						? {
								filename: card.imageMetadata.filename,
								size: card.imageMetadata.size,
								type: card.imageMetadata.type,
								lastModified: card.imageMetadata.lastModified
							}
						: undefined
				};

				blobRegistry.set(blobKey, blobId);
			}

			// Reference the blob instead of inline data
			cleanedCard.image = `@blob:${blobId}`;
		} catch (error) {
			console.warn('Failed to process image blob, falling back to URL:', error);
			if (card.image) {
				cleanedCard.image = card.image;
			}
		}
	} else if (card.image) {
		// Keep external URLs as-is
		cleanedCard.image = card.image;
	}

	return cleanedCard;
}

/**
 * Create a clean copy of a trait
 */
function cleanTrait(trait: Trait): Trait {
	return {
		title: trait.title,
		description: trait.description,
		isPublic: trait.isPublic
	};
}

/**
 * Create a clean copy of a stat
 */
function cleanStat(stat: Stat): Stat {
	return {
		title: stat.title,
		value: stat.value,
		isPublic: stat.isPublic,
		tracked: stat.tracked,
		description: stat.description || ''
	};
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

/**
 * Export deck as formatted JSON string (pretty-printed) - async for image processing
 */
export async function exportDeckAsJsonString(
	deck: Deck,
	includeBlobs: boolean = false,
	indent: number = 2
): Promise<string> {
	const jsonExport = await exportDeckToJson(deck, includeBlobs);
	return JSON.stringify(jsonExport, null, indent);
}

/**
 * Generate a filename for JSON export
 */
export function generateJsonFilename(deck: Deck): string {
	return createDeckFilename(deck.meta.title, 'json', true);
}

/**
 * Create a downloadable JSON file blob - async for image processing
 */
export async function createJsonBlob(deck: Deck, includeBlobs: boolean = false): Promise<Blob> {
	const jsonString = await exportDeckAsJsonString(deck, includeBlobs);
	return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Trigger download of deck as JSON file (browser only) - async for image processing
 */
export async function downloadDeckAsJson(deck: Deck, includeBlobs: boolean = false): Promise<void> {
	if (typeof document === 'undefined') {
		throw new Error('Download functionality requires browser environment');
	}

	const blob = await createJsonBlob(deck, includeBlobs);
	const url = URL.createObjectURL(blob);
	const filename = generateJsonFilename(deck);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();

	// Cleanup
	URL.revokeObjectURL(url);
}

// =============================================================================
// SIZE AND ANALYTICS
// =============================================================================

/**
 * Estimate the size of the JSON export - async for image processing
 */
export async function estimateJsonSize(
	deck: Deck,
	includeBlobs: boolean = false
): Promise<{
	formatted: number;
	minified: number;
	readableSize: string;
	minifiedSize: string;
}> {
	const formatted = await exportDeckAsJsonString(deck, includeBlobs, 2);
	const minified = await exportDeckAsJsonString(deck, includeBlobs, 0);

	return {
		formatted: formatted.length,
		minified: minified.length,
		readableSize: formatBytes(formatted.length),
		minifiedSize: formatBytes(minified.length)
	};
}

/**
 * Format bytes as human readable string
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// =============================================================================
// AI PROMPT HELPERS
// =============================================================================

/**
 * Generate AI prompt for deck creation with the correct JSON format
 */
export function generateAiPrompt(theme: string, cardCount: number = 10): string {
	// Create example using actual types
	const exampleDeck: Deck = {
		id: 'example-theme-deck',
		meta: {
			title: `${theme} Characters`,
			description: `A collection of characters from ${theme}`,
			theme: 'classic',
			layout: 'tarot',
			lastEdited: Date.now(),
			createdAt: Date.now()
		},
		cards: [
			{
				id: 'example-character-1',
				title: 'Character Name',
				subtitle: 'Character Title/Role',
				description:
					'Rich, detailed character description with personality, background, and motivations that bring them to life.',
				image: 'https://example.com/character-image.jpg',
				traits: [
					{
						title: 'Defining Trait',
						description:
							"A key characteristic that defines this character's personality or abilities",
						isPublic: true
					},
					{
						title: 'Hidden Secret',
						description: "Something about the character that others don't know",
						isPublic: false
					}
				],
				stats: [
					{
						title: 'Primary Attribute',
						value: 15,
						isPublic: true,
						tracked: true,
						description: "Main stat that defines the character's core strength"
					},
					{
						title: 'Secondary Skill',
						value: 12,
						isPublic: true,
						tracked: false,
						description: 'Supporting ability that adds character depth'
					}
				]
			}
		]
	};

	// Create example export manually for prompt (no async needed for examples without blobs)
	const exampleExport = {
		deck: exampleDeck,
		exportMeta: {
			exportedAt: Date.now(),
			exportVersion: '1.0.0',
			source: 'https://cards.astounding.games'
		}
	};
	const exampleJson = JSON.stringify(exampleExport, null, 2);

	return `Please create a complete character deck for "${theme}" with exactly ${cardCount} characters.

Use this EXACT JSON structure:

\`\`\`json
${exampleJson}
\`\`\`

Requirements:
- Use the exact property names shown (no abbreviations)
- Each character needs: unique id, title, subtitle, rich description
- Add 2-4 meaningful traits per character (mix public/private)
- Add 2-4 stats per character with values 1-20 (mix tracked/untracked)  
- **IMPORTANT**: Use random UUIDs for all IDs (both deck and card IDs)
- Make descriptions detailed and flavorful
- Set isPublic: true for traits/stats visible to other players
- Set tracked: true for stats that change during gameplay
- Include image URLs if you can find good ones (optional)
- Change the deck id, title, and description to match ${theme}

Return only the JSON, no additional text.`;
}

/**
 * Copy AI prompt to clipboard (browser only)
 */
export async function copyAiPromptToClipboard(
	theme: string,
	cardCount: number = 10
): Promise<boolean> {
	try {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			const prompt = generateAiPrompt(theme, cardCount);
			await navigator.clipboard.writeText(prompt);
			return true;
		}
		return false;
	} catch (error) {
		console.warn('Failed to copy to clipboard:', error);
		return false;
	}
}
