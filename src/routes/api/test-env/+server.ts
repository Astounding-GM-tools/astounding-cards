/**
 * Environment Variables Diagnostic
 *
 * Check if Supabase environment variables are loaded
 * (Don't expose actual values for security)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Import environment variables
		const { SUPABASE_SECRET_API_KEY } = await import('$env/static/private');
		const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } = await import('$env/static/public');

		return json({
			success: true,
			env: {
				SUPABASE_SECRET_API_KEY: SUPABASE_SECRET_API_KEY ? '✅ Set' : '❌ Missing',
				PUBLIC_SUPABASE_URL: PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
				PUBLIC_SUPABASE_ANON_KEY: PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
				// Show partial values for debugging (first 10 chars only)
				urlPrefix: PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
				keyPrefix: PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
			}
		});
	} catch (error) {
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				message:
					'Failed to load environment variables. Make sure .env.local exists and dev server was restarted.'
			},
			{ status: 500 }
		);
	}
};
