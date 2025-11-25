<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="action-bar">
	{@render children()}
</div>

<style>
	.action-bar {
		container-type: inline-size;
		container-name: action-bar;
		display: flex;
		flex-direction: row;
		gap: 0.75rem;
		padding: 1rem;
		flex-wrap: wrap;
		align-items: center;
		max-width: var(--page-max-width);
		margin: 0 auto;
		justify-content: flex-end;
	}

	/* Hide in print mode */
	@media print {
		.action-bar {
			display: none;
		}
	}

	/* Container queries for future mobile adaptation */
	/* Example for when we need it:
	@container action-bar (max-width: 600px) {
		.action-bar {
			flex-direction: column;
			align-items: stretch;
		}
	}
	*/

	/* Responsive fallback */
	@media (max-width: 768px) {
		.action-bar {
			padding: 0.75rem 1rem;
			gap: 0.5rem;
		}
	}
	/* Responsive fallback */
	@media (max-width: 400px) {
		.action-bar {
			padding: 0.25rem 0;
			gap: 0.25rem;
		}
	}
</style>
