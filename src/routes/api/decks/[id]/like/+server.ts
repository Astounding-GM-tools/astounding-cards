/**
 * Like Deck API
 *
 * POST /api/decks/[id]/like - Like a deck (costs 10 tokens)
 * DELETE /api/decks/[id]/like - Unlike a deck (no refund)
 * GET /api/decks/[id]/like - Check if user has liked this deck
 *
 * Token distribution:
 * - Original deck (no remix_of): 10 tokens to creator
 * - Remix deck (has remix_of): 5 tokens to creator + 5 tokens to original creator
 *
 * Requires authentication for POST/DELETE
 */

import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';
import type { RequestHandler } from './$types';

/**
 * POST - Like a deck (costs 10 tokens)
 */
export const POST: RequestHandler = async ({ params, cookies, request }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// 2. Get deck ID from URL
		const deckId = params.id;
		if (!deckId) {
			return error(400, 'Deck ID is required');
		}

		// 3. Call the process_deck_like function
		const { data, error: rpcError } = await supabaseAdmin.rpc('process_deck_like', {
			p_user_id: userId,
			p_deck_id: deckId
		});

		if (rpcError) {
			console.error('Like deck RPC error:', rpcError);
			return json({ success: false, error: 'Failed to process like' }, { status: 500 });
		}

		// 4. Check result - handle both null data and unsuccessful response
		if (!data) {
			console.error('Like deck: No data returned from RPC');
			return json({ success: false, error: 'Failed to process like' }, { status: 500 });
		}

		if (!data.success) {
			// Return specific error from function (this is expected for business logic errors)
			console.log('Like deck rejected:', data.error);

			// Determine appropriate status code based on error type
			let statusCode = 400; // Default to Bad Request
			if (data.error.includes('already liked')) {
				statusCode = 409; // Conflict - already exists
			} else if (data.error.includes('cannot like your own deck')) {
				statusCode = 403; // Forbidden - permission denied
			} else if (data.error.includes('Insufficient tokens')) {
				statusCode = 402; // Payment Required
			} else if (data.error.includes('not found')) {
				statusCode = 404; // Not Found
			}

			return json({ success: false, error: data.error }, { status: statusCode });
		}

		// 5. Return success with details
		return json({
			success: true,
			message: 'Deck liked successfully!',
			tokens_spent: 10,
			tokens_to_creator: data.tokens_to_creator,
			tokens_to_parent: data.tokens_to_parent,
			is_remix: data.is_remix
		});
	} catch (err) {
		console.error('Like deck error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to like deck');
	}
};

/**
 * DELETE - Unlike a deck (no refund)
 */
export const DELETE: RequestHandler = async ({ params, cookies, request }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// 2. Get deck ID from URL
		const deckId = params.id;
		if (!deckId) {
			return error(400, 'Deck ID is required');
		}

		// 3. Call the process_deck_unlike function
		const { data, error: rpcError } = await supabaseAdmin.rpc('process_deck_unlike', {
			p_user_id: userId,
			p_deck_id: deckId
		});

		if (rpcError) {
			console.error('Unlike deck RPC error:', rpcError);
			return json({ success: false, error: 'Failed to process unlike' }, { status: 500 });
		}

		// 4. Check result - handle both null data and unsuccessful response
		if (!data) {
			console.error('Unlike deck: No data returned from RPC');
			return json({ success: false, error: 'Failed to process unlike' }, { status: 500 });
		}

		if (!data.success) {
			// Return specific error from function (this is expected for business logic errors)
			console.log('Unlike deck rejected:', data.error);

			// Determine appropriate status code based on error type
			let statusCode = 400; // Default to Bad Request
			if (data.error.includes('not liked')) {
				statusCode = 404; // Not Found - like doesn't exist
			}

			return json({ success: false, error: data.error }, { status: statusCode });
		}

		// 5. Return success
		return json({
			success: true,
			message: 'Like removed successfully (tokens not refunded)'
		});
	} catch (err) {
		console.error('Unlike deck error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to unlike deck');
	}
};

/**
 * GET - Check if user has liked this deck
 */
export const GET: RequestHandler = async ({ params, cookies, request }) => {
	try {
		// 1. Try to authenticate user (optional for GET)
		const userId = await getUserFromSession(cookies, request);

		// 2. Get deck ID from URL
		const deckId = params.id;
		if (!deckId) {
			return error(400, 'Deck ID is required');
		}

		// 3. If not authenticated, return false
		if (!userId) {
			return json({
				success: true,
				has_liked: false,
				requires_auth: true
			});
		}

		// 4. Check if user has liked this deck
		const { data, error: rpcError } = await supabaseAdmin.rpc('has_user_liked_deck', {
			p_user_id: userId,
			p_deck_id: deckId
		});

		if (rpcError) {
			console.error('Check like status RPC error:', rpcError);
			return error(500, 'Failed to check like status');
		}

		// 5. Return result
		return json({
			success: true,
			has_liked: data || false,
			requires_auth: false
		});
	} catch (err) {
		console.error('Check like status error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to check like status');
	}
};
