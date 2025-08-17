<script lang="ts">
	import type { Snippet } from 'svelte';

	const { children } = $props<{
		children?: Snippet;
	}>();
</script>

<article class="card">
	<div class="crop-mark top-left"></div>
	<div class="crop-mark top-right"></div>
	<div class="crop-mark bottom-left"></div>
	<div class="crop-mark bottom-right"></div>

	{#if children}
		{@render children()}
	{/if}
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		aspect-ratio: 5/7;
		flex: 0 0 auto;
		position: relative;
		padding: 2%;
		font-family: var(--font-body);
		color: var(--color);

		container-type: inline-size;
		container-name: card;
	}

	.crop-mark {
		--crop-offset: calc(-1 * var(--page-padding));
		position: absolute;
		width: var(--page-padding);
		height: var(--page-padding);
		border: 0.25mm solid #000;
		z-index: 1;
	}

	.crop-mark.top-left {
		top: var(--crop-offset);
		left: var(--crop-offset);
		border-left-style: none;
		border-top-style: none;
	}

	.crop-mark.top-right {
		top: var(--crop-offset);
		right: var(--crop-offset);
		border-right-style: none;
		border-top-style: none;
	}

	.crop-mark.bottom-left {
		bottom: var(--crop-offset);
		left: var(--crop-offset);
		border-left-style: none;
		border-bottom-style: none;
	}

	.crop-mark.bottom-right {
		bottom: var(--crop-offset);
		right: var(--crop-offset);
		border-right-style: none;
		border-bottom-style: none;
	}
</style>
