<script lang="ts">
	import '$lib/next/styles/properties.css';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import Toasts from '$lib/components/ui/Toasts.svelte';
	import { dev } from '$app/environment';
	import type { Snippet } from 'svelte';

	const { children } = $props<{
		children?: Snippet;
	}>();
	
	// Expose dev helpers to browser console in dev mode
	if (dev && typeof window !== 'undefined') {
		import('$lib/dev/console-helpers').then((helpers) => {
			window.devHelpers = {
				addTokens: helpers.addTokens,
				checkBalance: helpers.checkBalance
			};
			console.log('🛠️ Dev helpers loaded. Try: await window.devHelpers.addTokens(1000)');
		});
	}
</script>

{@render children()}

<Dialog />
<Toasts />
