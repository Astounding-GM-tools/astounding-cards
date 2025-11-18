import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';
import { PUBLIC_R2_PATH_PREFIX } from '$env/static/private';

/**
 * POST /api/tokens/dev-add
 *
 * DEV ONLY: Adds tokens to the authenticated user's balance for testing.
 * Only enabled when PUBLIC_R2_PATH_PREFIX=dev
 *
 * Body: { amount: number }
 *
 * Usage from browser console:
 * ```js
 * // Helper to get auth token
 * const getToken = () => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')))).access_token;
 *
 * // Add tokens
 * await fetch('/api/tokens/dev-add', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${getToken()}`
 *   },
 *   body: JSON.stringify({ amount: 1000 })
 * }).then(r => r.json()).then(console.log)
 *
 * // Refresh page to see new balance
 * ```
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	// Only allow in dev environment
	if (PUBLIC_R2_PATH_PREFIX !== 'dev') {
		return json({ error: 'This endpoint is only available in dev environment' }, { status: 403 });
	}

	try {
		// Authenticate user
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Get amount from body
		const body = await request.json();
		const amount = body.amount;

		if (typeof amount !== 'number' || amount <= 0) {
			return json({ error: 'Invalid amount - must be a positive number' }, { status: 400 });
		}

		// Fetch current balance
		const { data: userData, error: fetchError } = await supabaseAdmin
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (fetchError) {
			console.error('Error fetching current credits:', fetchError);
			return json({ error: 'Failed to fetch current balance' }, { status: 500 });
		}

		const currentCredits = userData?.credits ?? 0;
		const newCredits = currentCredits + amount;

		// Update balance
		const { error: updateError } = await supabaseAdmin
			.from('users')
			.update({ credits: newCredits })
			.eq('id', userId);

		if (updateError) {
			console.error('Error updating credits:', updateError);
			return json({ error: 'Failed to update balance' }, { status: 500 });
		}

		console.log(`[DEV] Added ${amount} tokens to user ${userId}. New balance: ${newCredits}`);

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
