/**
 * Generate Embedding API
 *
 * Server-side text embedding generation for cards and decks
 * Uses Gemini text-embedding-004 to create 768-dimensional vectors
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateEmbedding } from '$lib/server/embeddings';
import { getUserFromSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// 2. Parse request body
		const { text } = await request.json();

		// 3. Validate input
		if (!text || typeof text !== 'string') {
			return error(400, 'Text is required and must be a string');
		}

		if (text.length === 0) {
			return error(400, 'Text cannot be empty');
		}

		if (text.length > 10000) {
			return error(400, 'Text is too long (max 10,000 characters)');
		}

		console.log(`🧮 Generating embedding for text (${text.length} chars)`);

		// 4. Generate embedding
		const embedding = await generateEmbedding(text);

		console.log(`✅ Embedding generated (${embedding.length} dimensions)`);

		// 5. Return embedding
		return json({
			success: true,
			embedding,
			dimensions: embedding.length
		});
	} catch (err) {
		console.error('Generate embedding API error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to generate embedding');
	}
};
