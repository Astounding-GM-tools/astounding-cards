<script lang="ts">
	import Toasts from '$lib/components/ui/Toasts.svelte';

	import { authenticatedFetch } from '$lib/utils/authenticated-fetch';
	import { refreshTokenBalance } from '$lib/next/stores/tokenBalance';

	import { onMount } from 'svelte';
	import { inject } from '@vercel/analytics';

	import '$lib/styles/global.css';
	import { PUBLIC_R2_PATH_PREFIX } from '$env/static/public';

	// Initialize Vercel Web Analytics
	inject();

	// Expose dev helpers to browser console
	onMount(() => {
		if (typeof window === 'undefined') return;
		if (PUBLIC_R2_PATH_PREFIX !== 'dev') return;

		// Define helpers
		window.devHelpers = {
			async addTokens(amount: number) {
				try {
					const response = await authenticatedFetch('/api/tokens/dev-add', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ amount })
					});
					const result = await response.json();
					if (result.success) {
						await refreshTokenBalance();
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
					const response = await authenticatedFetch('/api/tokens/balance');
					const result = await response.json();
					if (result.balance !== undefined) {
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
			'%c🛠️ Dev Helpers Available',
			'font-weight: bold; font-size: 14px; color: #059669;'
		);
			'%cCheck balance:',
			'font-weight: bold;',
			'\nawait window.devHelpers.checkBalance()'
		);
	});
</script>

<slot />
<Toasts />
