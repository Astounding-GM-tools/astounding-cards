<script lang="ts">
	import type { HeadlineBlockProps } from './types';

	const { content, headerType, class: className }: HeadlineBlockProps = $props();
</script>

<section class="headline" class:className>
	<svelte:element this={headerType}>{content}</svelte:element>
</section>

<style>
	.headline {
		margin: 0 0 1rem 0;
		min-width: 50%;
	}
	:global(.headline h1, .headline h2, .headline h3) {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--ui-text);
	}
</style>
