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
		const { card, embedding, deckDescription, preferredStyle, limit = 10 } = await request.json();
		console.log('🔍 Search request:', {
			hasCard: !!card,
			cardTitle: card?.title,
			hasEmbedding: !!embedding,
			hasDeckDescription: !!deckDescription,
			preferredStyle,
			limit
		});

		// 3. Get or generate embedding
		let queryEmbedding: number[] | null = null;

		if (embedding && Array.isArray(embedding)) {
			// Use provided embedding (from explicit user action)
			console.log('✅ Using provided embedding');
			queryEmbedding = embedding;
		} else if (deckDescription) {
			// Use deck description for embedding (default behavior)
			console.log('📝 Generating embedding from deck description');
			queryEmbedding = await generateEmbedding(deckDescription);
		} else if (card) {
			// Fallback: generate from card content
			const hasContent = card.title || card.description || card.subtitle || (card.traits && card.traits.length > 0);

			if (hasContent) {
				console.log('🃏 Generating embedding from card content');
				const optimizedPrompt = createPromptOptimizationRequest(
					card.title || 'Untitled',
					card.subtitle || '',
					card.description || '',
					'classic', // Style doesn't matter for semantic search
					card.traits || [],
					card.stats || []
				);
				queryEmbedding = await generateEmbedding(optimizedPrompt);
			} else {
				// For empty cards/decks, return random/recent images
				console.log('ℹ️ No content - will return random community images');
				queryEmbedding = null;
			}
		} else {
			return error(400, 'Card or deck description must be provided');
		}

		// 4. Validate embedding (if one was generated)
		if (queryEmbedding !== null && queryEmbedding.length !== 3072) {
			return error(400, 'Invalid embedding (must be 3072-dimensional vector)');
		}


		// 5. Call Supabase search function
		const { data, error: searchError } = await supabaseAdmin.rpc('search_similar_images', {
			p_query_embedding: queryEmbedding ? `[${queryEmbedding.join(',')}]` : null,
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
