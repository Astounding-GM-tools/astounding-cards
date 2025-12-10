/**
 * Text Embedding Generation
 *
 * Uses Gemini embedding model to generate 3072-dimensional embeddings
 * for semantic search in the community image library.
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';
import { AI_CONFIGS } from '$lib/ai/config/models';

if (!GEMINI_API_KEY) {
	throw new Error('GEMINI_API_KEY is required for embedding generation');
}

/**
 * Generate text embedding using Gemini embedding model
 *
 * @param text - The text to embed (typically the optimized image prompt)
 * @returns 3072-dimensional embedding vector as number array
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
	const config = AI_CONFIGS.EMBEDDING;

	try {
		// Use embedContent with contents parameter (string or array)
		const result = await ai.models.embedContent({
			model: config.model,
			contents: text
		});

		// Extract embedding values (single embedding when contents is a string)
		const embedding = result.embeddings?.[0] || result.embedding;
		if (!embedding?.values || embedding.values.length === 0) {
			throw new Error('No embedding values returned from Gemini');
		}

		// Verify dimensionality
		if (embedding.values.length !== config.dimensions) {
			console.warn(`Unexpected embedding dimension: ${embedding.values.length} (expected ${config.dimensions})`);
		}

		return embedding.values;
	} catch (error) {
		console.error('Embedding generation error:', error);
		throw new Error(
			`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
