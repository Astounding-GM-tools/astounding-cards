<script lang="ts">
	import type { ImageBlockProps } from './types';

	const { content, caption, class: className }: ImageBlockProps = $props();
</script>

<figure class="image" class:className>
	<img src={content} alt={caption} />
	{#if caption}
		<figcaption>{caption}</figcaption>
	{/if}
</figure>

<style>
	.image {
		margin: 0;
		border-radius: 8px;
		overflow: hidden;
	}
	img {
		width: 100%;
		height: auto;
		display: block;
	}
	figcaption {
		padding: 0.5rem;
		background: var(--ui-hover-bg);
		font-size: 0.875rem;
		color: var(--ui-muted);
		text-align: center;
	}
</style>
