/**
 * Token Balance Store
 *
 * Manages user token inventory for premium features.
 * Tokens are used for AI generation, cloud storage, and other premium features.
 */

import { writable, derived, get } from 'svelte/store';
import { isAuthenticated, authLoading } from './auth';
import { getAuthHeaders } from '$lib/utils/auth-helpers';

interface TokenBalance {
	amount: number;
	loading: boolean;
	error: string | null;
}

function createTokenBalanceStore() {
	const { subscribe, set, update } = writable<TokenBalance>({
		amount: 0,
		loading: false,
		error: null
	});

	// Fetch token balance from API
	async function fetchBalance() {
		update((state) => ({ ...state, loading: true, error: null }));

		try {
			const response = await fetch('/api/tokens/balance', {
				headers: getAuthHeaders()
			});

			// 401 is expected when not authenticated - not an error, just reset
			if (response.status === 401) {
				update((state) => ({
					...state,
					amount: 0,
					loading: false,
					error: null
				}));
				return;
			}

			if (!response.ok) {
				throw new Error('Failed to fetch token balance');
			}

			const data = await response.json();

			update((state) => ({
				...state,
				amount: data.balance ?? 0,
				loading: false
			}));
		} catch (error) {
			console.error('Token balance fetch error:', error);
			update((state) => ({
				...state,
				loading: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			}));
		}
	}

	// Deduct tokens (optimistic update, will be confirmed by server)
	function deduct(amount: number) {
		update((state) => ({
			...state,
			amount: Math.max(0, state.amount - amount)
		}));
	}

	// Add tokens (e.g., after purchase)
	function add(amount: number) {
		update((state) => ({
			...state,
			amount: state.amount + amount
		}));
	}

	// Reset balance (e.g., on logout)
	function reset() {
		set({
			amount: 0,
			loading: false,
			error: null
		});
	}

	return {
		subscribe,
		fetchBalance,
		deduct,
		add,
		reset
	};
}

export const tokenBalanceStore = createTokenBalanceStore();

// Derived store for token amount only
export const tokenAmount = derived(tokenBalanceStore, ($balance) => $balance.amount);

// Derived store for loading state
export const tokenLoading = derived(tokenBalanceStore, ($balance) => $balance.loading);

// Helper to check if user can afford a cost
export function canAfford(cost: number, balance: number): boolean {
	return balance >= cost;
}

// Helper to refresh token balance (e.g., after generation)
export async function refreshTokenBalance(): Promise<void> {
	await tokenBalanceStore.fetchBalance();
}

// Auto-fetch balance when user logs in (but only on actual auth changes)
let previousAuthState: boolean | null = null;
isAuthenticated.subscribe(async (authenticated) => {
	// Skip the very first call (initial subscription)
	if (previousAuthState === null) {
		previousAuthState = authenticated;
		return;
	}

	// Only proceed if auth state actually changed
	if (previousAuthState === authenticated) {
		return;
	}

	previousAuthState = authenticated;

	if (authenticated) {
		await tokenBalanceStore.fetchBalance();
	} else {
		tokenBalanceStore.reset();
	}
});
