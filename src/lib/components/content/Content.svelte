<script lang="ts">
	import type { ContentProps } from './types';

	import TextBlock from './TextBlock.svelte';
	import ImageBlock from './ImageBlock.svelte';
	import HeadlineBlock from './HeadlineBlock.svelte';

	// receive blocks as a prop
	export let blocks: ContentProps['blocks'];

	const Renderers: Record<string, any> = {
		text: TextBlock,
		image: ImageBlock,
		headline: HeadlineBlock
	};
</script>

<section class="content">
	{#each blocks as block}
		{#if Renderers[block.type]}
			<div class="content-block">
				<svelte:component this={Renderers[block.type]} {...block} />
			</div>
		{/if}
	{/each}
</section>

<style>
	.content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}
</style>
