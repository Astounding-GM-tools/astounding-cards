/**
 * Server-Side Authentication Helpers
 *
 * Utilities for extracting and validating user sessions in API routes.
 * Supports both cookie-based and Authorization header-based authentication.
 */

import { supabase } from '$lib/supabaseClient';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';

/**
 * Extract authenticated user ID from request
 * Checks both cookies and Authorization header
 *
 * @param request - SvelteKit request object
 * @param cookies - SvelteKit cookies object
 * @returns User ID if authenticated, null otherwise
 */
export async function getUserFromSession(
	cookies: Cookies,
	request?: Request
): Promise<string | null> {
	// Try cookies first (for future SSR compatibility)
	let accessToken = cookies.get('sb-access-token');
	let refreshToken = cookies.get('sb-refresh-token');

	// If no cookies, try Authorization header (for client-side localStorage auth)
	if ((!accessToken || !refreshToken) && request) {
		const authHeader = request.headers.get('Authorization');
		if (authHeader?.startsWith('Bearer ')) {
			accessToken = authHeader.substring(7);
			// Note: We don't have refresh token from header, will use getUser instead
		}
	}

	if (!accessToken) {
		return null;
	}

	// If we have both tokens, use setSession
	if (refreshToken) {
		const {
			data: { user },
			error
		} = await supabase.auth.setSession({
			access_token: accessToken,
			refresh_token: refreshToken
		});

		if (error || !user) {
			console.warn('Session validation failed:', error?.message);
			return null;
		}

		return user.id;
	}

	// If we only have access token (from Authorization header), use getUser
	const {
		data: { user },
		error
	} = await supabase.auth.getUser(accessToken);

	if (error || !user) {
		console.warn('Token validation failed:', error?.message);
		return null;
	}

	return user.id;
}

/**
 * Extract authenticated user with full session data
 *
 * @param cookies - SvelteKit cookies object from request
 * @returns User and session if authenticated, null otherwise
 */
export async function getFullSession(cookies: Cookies) {
	const accessToken = cookies.get('sb-access-token');
	const refreshToken = cookies.get('sb-refresh-token');

	if (!accessToken || !refreshToken) {
		return { user: null, session: null };
	}

	const {
		data: { user, session },
		error
	} = await supabase.auth.setSession({
		access_token: accessToken,
		refresh_token: refreshToken
	});

	if (error) {
		console.warn('Session validation failed:', error.message);
		return { user: null, session: null };
	}

	return { user, session };
}
