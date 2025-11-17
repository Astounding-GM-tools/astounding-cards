<script lang="ts">
	import '$lib/next/styles/properties.css';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import Toasts from '$lib/components/ui/Toasts.svelte';
	import { browser } from '$app/environment';
	import { getAuthHeaders } from '$lib/utils/auth-helpers';
	import { refreshTokenBalance } from '$lib/next/stores/tokenBalance';
	import type { Snippet } from 'svelte';

	const { children } = $props<{
		children?: Snippet;
	}>();

	// Expose dev helpers to browser console after mount
	$effect(() => {
		if (!browser) return;

		// Define helpers inline
		window.devHelpers = {
			async addTokens(amount: number) {
				try {
					const response = await fetch('/api/tokens/dev-add', {
						method: 'POST',
						headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
						body: JSON.stringify({ amount })
					});
					const result = await response.json();
					if (result.success) {
						console.log(`✅ ${result.message}`);
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
			},
			async checkBalance() {
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
		};

		// Show hints in console
		console.log(
			'%c🛠️ Dev Helpers Available',
			'font-weight: bold; font-size: 14px; color: #059669;'
		);
		console.log('%cAdd tokens:', 'font-weight: bold;', 'await window.devHelpers.addTokens(1000)');
		console.log('%cCheck balance:', 'font-weight: bold;', 'await window.devHelpers.checkBalance()');
	});
</script>

{@render children()}

<Dialog />
<Toasts />
