/**
 * Card Embedding Utilities
 *
 * Generates semantic embeddings for cards to enable:
 * - Finding similar community images
 * - Suggesting related cards
 * - Future: semantic card search
 */

import type { Card } from '$lib/next/types/card';
import { authenticatedFetch } from './authenticated-fetch';

/**
 * Generate semantic text representation of a card
 * This focuses on content that matters for finding similar images:
 * - Title, subtitle, description
 * - Traits (not stats, as they're more mechanical)
 */
export function cardToSemanticText(card: Card): string {
	const parts: string[] = [];

	if (card.title) parts.push(`Title: ${card.title}`);
	if (card.subtitle) parts.push(`Type: ${card.subtitle}`);
	if (card.description) parts.push(`Description: ${card.description}`);

	// Include traits (they describe visual/thematic aspects)
	const visibleTraits = card.traits?.filter(t => t.isPublic) || [];
	if (visibleTraits.length > 0) {
		const traitText = visibleTraits
			.map(t => `${t.title}: ${t.description}`)
			.join('; ');
		parts.push(`Traits: ${traitText}`);
	}

	return parts.join('\n');
}

/**
 * Generate a hash of the semantic content
 * Used to detect when embedding needs regeneration
 */
export async function generateContentHash(text: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(text);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if card embedding needs regeneration
 */
export function shouldRegenerateEmbedding(card: Card): boolean {
	// No embedding exists yet
	if (!card.embedding || !card.embeddingContentHash) {
		return true;
	}

	// Check if current content hash matches stored hash
	const currentText = cardToSemanticText(card);
	// We'll need to compare async, so this is a simplified check
	// In practice, you'd call generateContentHash and compare

	// For now, return false if embedding exists
	// The caller should implement the hash comparison
	return false;
}

/**
 * Generate embedding for a card via API
 * Returns the embedding vector and content hash
 */
export async function generateCardEmbedding(card: Card): Promise<{
	embedding: number[];
	contentHash: string;
}> {
	const semanticText = cardToSemanticText(card);
	const contentHash = await generateContentHash(semanticText);

	// Call server API to generate embedding
	const response = await authenticatedFetch('/api/ai/generate-embedding', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text: semanticText })
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to generate embedding: ${error}`);
	}

	const { embedding } = await response.json();

	return {
		embedding,
		contentHash
	};
}

/**
 * Update card with embedding if needed
 * Returns updated card (or original if no update needed)
 */
export async function ensureCardEmbedding(card: Card): Promise<Card> {
	// Check if embedding exists and content hasn't changed
	if (card.embedding && card.embeddingContentHash) {
		const currentText = cardToSemanticText(card);
		const currentHash = await generateContentHash(currentText);

		if (currentHash === card.embeddingContentHash) {
			// Embedding is up to date
			return card;
		}
	}

	// Generate new embedding
	const { embedding, contentHash } = await generateCardEmbedding(card);

	return {
		...card,
		embedding,
		embeddingContentHash: contentHash
	};
}
