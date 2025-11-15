import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { R2_PATH_PREFIX } from '$env/static/private';

/**
 * POST /api/tokens/dev-add
 * 
 * DEV ONLY: Adds tokens to the authenticated user's balance for testing.
 * Only enabled when R2_PATH_PREFIX=dev
 * 
 * Body: { amount: number }
 * 
 * Usage from browser console:
 * ```js
 * await fetch('/api/tokens/dev-add', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ amount: 1000 })
 * }).then(r => r.json()).then(console.log)
 * ```
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	// Only allow in dev environment
	if (R2_PATH_PREFIX !== 'dev') {
		return json({ error: 'This endpoint is only available in dev environment' }, { status: 403 });
	}

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

		// Get amount from body
		const body = await request.json();
		const amount = body.amount;

		if (typeof amount !== 'number' || amount <= 0) {
			return json({ error: 'Invalid amount - must be a positive number' }, { status: 400 });
		}

		// Fetch current balance
		const { data: userData, error: fetchError } = await supabase
			.from('users')
			.select('credits')
			.eq('id', user.id)
			.single();

		if (fetchError) {
			console.error('Error fetching current credits:', fetchError);
			return json({ error: 'Failed to fetch current balance' }, { status: 500 });
		}

		const currentCredits = userData?.credits ?? 0;
		const newCredits = currentCredits + amount;

		// Update balance
		const { error: updateError } = await supabase
			.from('users')
			.update({ credits: newCredits })
			.eq('id', user.id);

		if (updateError) {
			console.error('Error updating credits:', updateError);
			return json({ error: 'Failed to update balance' }, { status: 500 });
		}

		console.log(`[DEV] Added ${amount} tokens to user ${user.id}. New balance: ${newCredits}`);

		return json({
			success: true,
			previousBalance: currentCredits,
			amountAdded: amount,
			newBalance: newCredits,
			message: `✅ Added ${amount} tokens. New balance: ${newCredits} tokens`
		});

	} catch (error) {
		console.error('Dev add tokens error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
