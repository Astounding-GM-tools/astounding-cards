/**
 * GET /api/tokens/transactions
 *
 * Get authenticated user's transaction history
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { getUserFromSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request, cookies, url }) => {
	try {
		// 1. Verify user authentication
		const userId = await getUserFromSession(cookies, request);
		if (!userId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// 2. Get pagination parameters
		const limit = parseInt(url.searchParams.get('limit') || '10', 10);
		const offset = parseInt(url.searchParams.get('offset') || '0', 10);

		// Validate pagination
		const validLimit = Math.min(Math.max(limit, 1), 100); // Max 100 per page
		const validOffset = Math.max(offset, 0);

		// 3. Fetch transactions
		const { data: transactions, error: fetchError, count } = await supabaseAdmin
			.from('transactions')
			.select('id, created_at, tokens_purchased, amount_usd, status, variant_name', {
				count: 'exact'
			})
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.range(validOffset, validOffset + validLimit - 1);

		if (fetchError) {
			console.error('[Transactions] Database error:', fetchError);
			return json({ error: 'Failed to fetch transactions' }, { status: 500 });
		}

		// 4. Return transactions
		return json({
			success: true,
			transactions: transactions || [],
			total: count || 0,
			limit: validLimit,
			offset: validOffset
		});
	} catch (error) {
		console.error('[Transactions] Unexpected error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
