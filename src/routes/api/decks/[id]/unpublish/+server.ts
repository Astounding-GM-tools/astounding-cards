/**
 * Unpublish Deck API
 *
 * DELETE /api/decks/[id]/unpublish
 *
 * Removes a deck from the public gallery.
 * Requires authentication and ownership.
 */

import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, cookies, request }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		const { id } = params;
		if (!id) {
			return error(400, 'Deck ID is required');
		}

		// 2. Verify ownership
		const { data: deck } = await supabaseAdmin
			.from('published_decks')
			.select('id, user_id')
			.eq('id', id)
			.single();

		if (!deck) {
			return error(404, 'Published deck not found');
		}

		if (deck.user_id !== userId) {
			return error(403, 'You do not own this deck');
		}

		// 3. Delete the deck
		const { error: deleteError } = await supabaseAdmin
			.from('published_decks')
			.delete()
			.eq('id', id);

		if (deleteError) {
			console.error('Failed to delete deck:', deleteError);
			return error(500, 'Failed to unpublish deck');
		}

		return json({
			success: true,
			message: 'Deck unpublished successfully'
		});
	} catch (err) {
		console.error('Unpublish deck error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to unpublish deck');
	}
};
