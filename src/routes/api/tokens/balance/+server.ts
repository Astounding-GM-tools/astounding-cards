import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

/**
 * GET /api/tokens/balance
 * 
 * Returns the authenticated user's token balance.
 * Tokens = credits (1:1 mapping, credits is DB term, tokens is user-facing term)
 */
export const GET: RequestHandler = async ({ request, cookies }) => {
	try {
		// Get auth token from cookie
		const accessToken = cookies.get('sb-access-token');
		const refreshToken = cookies.get('sb-refresh-token');

		if (!accessToken || !refreshToken) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Set session with tokens
		const { data: { user }, error: sessionError } = await supabase.auth.setSession({
			access_token: accessToken,
			refresh_token: refreshToken
		});

		if (sessionError || !user) {
			return json({ error: 'Invalid session' }, { status: 401 });
		}

		// Fetch user's credits from database
		const { data: userData, error: dbError } = await supabase
			.from('users')
			.select('credits')
			.eq('id', user.id)
			.single();

		if (dbError) {
			console.error('Database error fetching credits:', dbError);
			return json({ error: 'Failed to fetch balance' }, { status: 500 });
		}

		// Return balance (credits as tokens)
		return json({
			balance: userData?.credits ?? 0,
			userId: user.id
		});

	} catch (error) {
		console.error('Token balance error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
