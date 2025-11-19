/**
 * Authenticated Fetch Helper
 *
 * Wrapper around fetch that automatically includes auth headers
 */

import { getAuthHeaders } from './auth-helpers';

interface AuthenticatedFetchOptions extends Omit<RequestInit, 'headers'> {
	headers?: Record<string, string>;
}

/**
 * Makes an authenticated fetch request with automatic auth header injection
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (headers will be merged with auth headers)
 * @returns The fetch Response
 */
export async function authenticatedFetch(
	url: string,
	options: AuthenticatedFetchOptions = {}
): Promise<Response> {
	const { headers = {}, ...restOptions } = options;

	// Merge provided headers with auth headers
	const authHeaders = getAuthHeaders();
	const mergedHeaders = {
		...headers,
		...authHeaders
	};

	return fetch(url, {
		...restOptions,
		headers: mergedHeaders
	});
}
