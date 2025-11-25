/**
 * Auth Helper Utilities
 *
 * Helpers for working with Supabase auth tokens stored in localStorage
 */

/**
 * Gets the Supabase access token from localStorage
 *
 * @returns The access token, or null if not authenticated
 */
export function getAccessToken(): string | null {
	try {
		const authKey = Object.keys(localStorage).find((k) => k.includes('auth-token'));
		if (!authKey) {
			return null;
		}

		const authData = JSON.parse(localStorage.getItem(authKey)!);
		return authData?.access_token || null;
	} catch (error) {
		console.error('Error getting access token:', error);
		return null;
	}
}

/**
 * Creates headers with Authorization bearer token for API requests
 *
 * @param additionalHeaders Optional additional headers to include
 * @returns Headers object with Authorization header if authenticated
 */
export function getAuthHeaders(additionalHeaders: Record<string, string> = {}): HeadersInit {
	const token = getAccessToken();
	const headers: HeadersInit = { ...additionalHeaders };

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	return headers;
}
