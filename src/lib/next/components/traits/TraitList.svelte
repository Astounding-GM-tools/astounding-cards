<script lang="ts">
	import type { Trait } from '$lib/next/types/card';

	const { traits = [] } = $props<{
		traits: Trait[];
	}>();
</script>

<dl class="trait-list">
	{#each traits as trait}
		<dt class="trait-label">{trait.title}</dt>
		<dd class="trait-value">{trait.description}</dd>
	{/each}
</dl>

<style>
	.trait-list {
		display: grid;
		font-size: var(--font-size);
		gap: 0.2em 0.5em;
		grid-template-columns: auto 1fr;
		margin: 0.6em 0.8em;
	}

	.trait-label {
		font-size: 0.8em;
		font-weight: bold;
		grid-column: 1;
        width: min-content;
        min-width: 5em;
	}

	.trait-value {
		font-size: 0.8em;
		grid-column: 2;
		margin: 0;
	}
</style>
