<script lang="ts">
	import Pill from '../ui/Pill.svelte';
	import { Check, AlertTriangle } from 'lucide-svelte';

	interface Props {
		cardCount: number;
		imageCount?: number;
		published?: boolean;
		needsRepublish?: boolean;
	}

	let { cardCount, imageCount, published = false, needsRepublish = false }: Props = $props();
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

	<!-- Published Badge -->
	{#if published}
		<Pill variant="success" size="sm">
			{#snippet icon()}<Check size={12} />{/snippet}
			Published
		</Pill>
	{/if}

	<!-- Needs Republish Warning -->
	{#if needsRepublish}
		<Pill variant="warning" size="sm">
			{#snippet icon()}<AlertTriangle size={12} />{/snippet}
			Needs republish
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
