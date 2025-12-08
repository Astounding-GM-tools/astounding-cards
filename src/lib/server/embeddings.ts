/**
 * Text Embedding Generation
 *
 * Uses Gemini text-embedding-001 to generate 768-dimensional embeddings
 * for semantic search in the community image library.
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';

if (!GEMINI_API_KEY) {
	throw new Error('GEMINI_API_KEY is required for embedding generation');
}

/**
 * Generate text embedding using Gemini text-embedding-001
 *
 * @param text - The text to embed (typically the optimized image prompt)
 * @returns 768-dimensional embedding vector as number array
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

	try {
		// Use embedContent with contents parameter (string or array)
		const result = await ai.models.embedContent({
			model: 'text-embedding-001',
			contents: text
		});

		// Extract embedding values (single embedding when contents is a string)
		const embedding = result.embeddings?.[0] || result.embedding;
		if (!embedding?.values || embedding.values.length === 0) {
			throw new Error('No embedding values returned from Gemini');
		}

		// Verify dimensionality (should be 768)
		if (embedding.values.length !== 768) {
			console.warn(`Unexpected embedding dimension: ${embedding.values.length} (expected 768)`);
		}

		return embedding.values;
	} catch (error) {
		console.error('Embedding generation error:', error);
		throw new Error(
			`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
