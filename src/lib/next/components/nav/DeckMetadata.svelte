<script lang="ts">
	import Pill from '../ui/Pill.svelte';
	import { Check } from 'lucide-svelte';

	interface Props {
		cardCount: number;
		published?: boolean;
		imageCount?: number;
		genre?: string;
		shareCount?: number;
	}

	let { cardCount, published = false, imageCount, genre, shareCount }: Props = $props();
</script>

<div class="deck-metadata">
	<!-- Card Count -->
	<Pill variant="neutral" size="sm">
		<strong>{cardCount}</strong>
		{cardCount === 1 ? 'card' : 'cards'}
	</Pill>

	<!-- Image Count -->
	{#if imageCount !== undefined}
		<Pill variant="neutral" size="sm">
			{imageCount}
			{imageCount === 1 ? 'image' : 'images'}
		</Pill>
	{/if}

	<!-- Genre -->
	{#if genre}
		<Pill variant="neutral" size="sm">{genre}</Pill>
	{/if}

	<!-- Published Badge -->
	{#if published}
		<Pill variant="success" size="sm">
			{#snippet icon()}<Check size={12} />{/snippet}
			Published
		</Pill>
	{/if}

	<!-- Share Count -->
	{#if shareCount !== undefined && shareCount > 0}
		<Pill variant="neutral" size="sm">
			{shareCount}
			{shareCount === 1 ? 'share' : 'shares'}
		</Pill>
	{/if}
</div>

<style>
	.deck-metadata {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}
</style>
