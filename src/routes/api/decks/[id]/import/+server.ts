/**
 * Track Deck Import API
 *
 * POST /api/decks/[id]/import
 *
 * Increments the import counter for a published deck.
 * Public endpoint - no authentication required.
 */

import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return error(400, 'Deck ID is required');
		}

		// Increment import count using the database function
		const { error: rpcError } = await supabaseAdmin.rpc('increment_import_count', {
			deck_id: id
		});

		if (rpcError) {
			console.error('Failed to increment import count:', rpcError);
			// Don't fail the request if this fails - it's just analytics
		}

		return json({ success: true });
	} catch (err) {
		console.error('Import tracking error:', err);
		// Don't fail the request - analytics failure shouldn't break imports
		return json({ success: true });
	}
};
