<script lang="ts">
	import type { TextBlockProps } from './types';

	const { content, class: className }: TextBlockProps = $props();
</script>

<section class="text" class:className>
	{#each content as line}
		<svelte:element this={line.type}>{line.content}</svelte:element>
	{/each}
</section>

<style>
	.text {
		margin: 0;
		line-height: 1.6;
		color: var(--ui-muted);
		grid-row: span 2;
	}
</style>
