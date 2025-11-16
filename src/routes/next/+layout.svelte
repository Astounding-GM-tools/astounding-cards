<script lang="ts">
	import '$lib/next/styles/properties.css';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import Toasts from '$lib/components/ui/Toasts.svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	const { children } = $props<{
		children?: Snippet;
	}>();
	
	// Expose dev helpers to browser console (only in browser)
	if (browser) {
		import('$lib/dev/console-helpers').then((helpers) => {
			window.devHelpers = {
				addTokens: helpers.addTokens,
				checkBalance: helpers.checkBalance
			};
			
			// Show hints in console
			console.log('%c🛠️ Dev Helpers Available', 'font-weight: bold; font-size: 14px; color: #059669;');
			console.log('%cAdd tokens:', 'font-weight: bold;', 'await window.devHelpers.addTokens(1000)');
			console.log('%cCheck balance:', 'font-weight: bold;', 'await window.devHelpers.checkBalance()');
		}).catch(() => {
			// Silently fail if helpers can't load
		});
	}
</script>

{@render children()}

<Dialog />
<Toasts />
