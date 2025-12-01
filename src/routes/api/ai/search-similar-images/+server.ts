/**
 * Search Similar Images API
 *
 * Finds semantically similar images from the community library
 * Uses card embeddings to match against image embeddings
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';
import { generateEmbedding } from '$lib/server/embeddings';
import { createPromptOptimizationRequest } from '$lib/ai/prompts/image-generation';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// 2. Parse request body
		const { card, embedding, preferredStyle, limit = 10 } = await request.json();

		// 3. Get or generate embedding
		let queryEmbedding: number[];

		if (embedding && Array.isArray(embedding)) {
			// Use provided embedding
			queryEmbedding = embedding;
		} else if (card) {
			// Check if card has minimal content
			if (!card.title && !card.description && !card.subtitle && (!card.traits || card.traits.length === 0)) {
				console.warn('⚠️ Received empty card for similarity search');
				return error(400, 'Card must have some content (title, description, or traits) for similarity search');
			}

			// Generate embedding from card data

			// TODO: The above log is an empty card:

			/*
			{
				id: '1w72oe',
				title: '',
				subtitle: '',
				description: '',
				image: null,
				traits: [],
				stats: [],
				imageBlob: null,
				imageMetadata: null
				}
			*/

			// Most likely, the incorrect content is included in the request from the server?

			// Use the same prompt optimization as image generation for consistency
			const optimizedPrompt = createPromptOptimizationRequest(
				card.title || 'Untitled',
				card.subtitle || '',
				card.description || '',
				'classic', // Style doesn't matter for semantic search
				card.traits || [],
				card.stats || []
			);

			// Generate embedding from optimized prompt
			queryEmbedding = await generateEmbedding(optimizedPrompt);
		} else {
			return error(400, 'Either card or embedding must be provided');
		}

		// 4. Validate embedding
		if (!queryEmbedding || queryEmbedding.length !== 768) {
			return error(400, 'Invalid embedding (must be 768-dimensional vector)');
		}


		// 5. Call Supabase search function
		const { data, error: searchError } = await supabaseAdmin.rpc('search_similar_images', {
			p_query_embedding: `[${queryEmbedding.join(',')}]`,
			p_preferred_style: preferredStyle || null,
			p_limit: limit
		});

		if (searchError) {
			console.error('Search error:', searchError);
			return error(500, `Search failed: ${searchError.message}`);
		}

		// 6. Format results
		const results = data || [];

		return json({
			success: true,
			results,
			totalFound: results.length
		});
	} catch (err) {
		// If it's a SvelteKit error (like 401/400), rethrow it
		if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
			throw err;
		}

		// Log detailed error information for debugging
		const errorDetails = {
			message: err instanceof Error ? err.message : 'Unknown error',
			stack: err instanceof Error ? err.stack : undefined,
			type: typeof err,
			name: err instanceof Error ? err.name : undefined
		};

		console.error('❌ Search similar images API error:', errorDetails);

		// Return user-friendly error (detailed logging is in console for debugging)
		return error(500, err instanceof Error ? err.message : 'Failed to search images');
	}
};
