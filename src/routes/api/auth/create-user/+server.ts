/**
 * Create User Record API
 *
 * Called after successful signup to create a user record in public.users
 * with welcome bonus tokens.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { NEW_USER_WELCOME_BONUS } from '$lib/config/token-costs';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, email } = await request.json();

		if (!userId || !email) {
			return error(400, 'User ID and email are required');
		}

		// Create user record with welcome bonus
		const { error: dbError } = await supabaseAdmin.from('users').insert({
			id: userId,
			email,
			credits: NEW_USER_WELCOME_BONUS
		});

		// Ignore conflict errors (user already exists)
		if (dbError && dbError.code !== '23505') {
			console.error('Failed to create user record:', dbError);
			return error(500, 'Failed to create user record');
		}

		console.log(`✅ Created user record for ${email} with ${NEW_USER_WELCOME_BONUS} tokens`);

		return json({
			success: true,
			credits: NEW_USER_WELCOME_BONUS
		});
	} catch (err) {
		console.error('Create user API error:', err);
		return error(500, 'Internal server error');
	}
};
