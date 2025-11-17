import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';

/**
 * GET /api/tokens/balance
 *
 * Returns the authenticated user's token balance.
 * Tokens = credits (1:1 mapping, credits is DB term, tokens is user-facing term)
 */
export const GET: RequestHandler = async ({ request, cookies }) => {
	try {
		// Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Fetch user's credits from database
		const { data: userData, error: dbError } = await supabaseAdmin
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (dbError) {
			console.error('Database error fetching credits:', dbError);
			return json({ error: 'Failed to fetch balance' }, { status: 500 });
		}

		// Return balance (credits as tokens)
		return json({
			balance: userData?.credits ?? 0,
			userId
		});
	} catch (error) {
		console.error('Token balance error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
