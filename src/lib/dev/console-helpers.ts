/**
 * Dev Console Helpers
 *
 * Utilities exposed to browser console for development and testing.
 * Only available in dev environment.
 */

import { getAuthHeaders } from '$lib/utils/auth-helpers';
import { refreshTokenBalance } from '$lib/next/stores/tokenBalance';

/**
 * Adds tokens to the current user's balance (dev only)
 *
 * @param amount Number of tokens to add
 * @returns Promise with the API response
 *
 * @example
 * // In browser console:
 * await window.devHelpers.addTokens(1000)
 */
export async function addTokens(amount: number) {
	try {
		const response = await fetch('/api/tokens/dev-add', {
			method: 'POST',
			headers: getAuthHeaders({
				'Content-Type': 'application/json'
			}),
			body: JSON.stringify({ amount })
		});

		const result = await response.json();

		if (result.success) {
			console.log(`✅ ${result.message}`);

			// Refresh token balance in UI
			await refreshTokenBalance();
			console.log('🔄 Token balance refreshed in UI');
		} else {
			console.error('❌ Failed to add tokens:', result.error);
		}

		return result;
	} catch (error) {
		console.error('❌ Error adding tokens:', error);
		throw error;
	}
}

/**
 * Checks the current token balance
 *
 * @returns Promise with the balance data
 *
 * @example
 * // In browser console:
 * await window.devHelpers.checkBalance()
 */
export async function checkBalance() {
	try {
		const response = await fetch('/api/tokens/balance', {
			headers: getAuthHeaders()
		});

		const result = await response.json();

		if (result.balance !== undefined) {
			console.log(`💰 Current balance: ${result.balance} tokens`);
		} else {
			console.error('❌ Failed to fetch balance:', result.error);
		}

		return result;
	} catch (error) {
		console.error('❌ Error fetching balance:', error);
		throw error;
	}
}

// Type definition for window object
declare global {
	interface Window {
		devHelpers?: {
			addTokens: typeof addTokens;
			checkBalance: typeof checkBalance;
		};
	}
}
