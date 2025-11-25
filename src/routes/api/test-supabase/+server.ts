/**
 * Test Supabase Connection
 *
 * Simple endpoint to verify Supabase is configured correctly
 */

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Test database connection by querying published_decks table
		const { data, error, count } = await supabaseAdmin
			.from('published_decks')
			.select('*', { count: 'exact', head: true });

		if (error) {
			console.error('Supabase error:', error);
			return json(
				{
					success: false,
					error: error.message,
					details: error
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Supabase connection successful!',
			deckCount: count ?? 0,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Connection test failed:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
