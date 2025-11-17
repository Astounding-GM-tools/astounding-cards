<script lang="ts">
	import type { ImageStyle } from '$lib/next/types/deck.js';
	import Badge from '../ui/Badge.svelte';
	import Dropdown from '../ui/Dropdown.svelte';

	interface Props {
		cardCount: number;
		imageStyle?: ImageStyle;
		onImageStyleChange?: (style: ImageStyle) => void;
		cardBacksVisible?: boolean;
		onCardBacksChange?: (visible: boolean) => void;
		published?: boolean;
		imageCount?: number;
		genre?: string;
		shareCount?: number;
	}

	let {
		cardCount,
		imageStyle,
		onImageStyleChange,
		cardBacksVisible = true,
		onCardBacksChange,
		published = false,
		imageCount,
		genre,
		shareCount
	}: Props = $props();

	const CARD_BACKS_OPTIONS = [
		{ value: 'visible', label: 'Visible' },
		{ value: 'hidden', label: 'Hidden' }
	];

	const IMAGE_STYLE_OPTIONS = [
		{ value: 'classic', label: 'Classic' },
		{ value: 'ink', label: 'Ink' },
		{ value: 'watercolor', label: 'Watercolor' },
		{ value: 'sketch', label: 'Sketch' }
	];

	function handleCardBacksChange(value: string) {
		onCardBacksChange?.(value === 'visible');
	}

	function handleImageStyleChange(value: string) {
		onImageStyleChange?.(value as ImageStyle);
	}
</script>

<div class="deck-metadata">
	<!-- Card Count -->
	<Badge variant="neutral" size="sm">
		<strong>{cardCount}</strong>
		{cardCount === 1 ? 'card' : 'cards'}
	</Badge>

	<!-- Image Count -->
	{#if imageCount !== undefined}
		<Badge variant="neutral" size="sm">
			{imageCount}
			{imageCount === 1 ? 'image' : 'images'}
		</Badge>
	{/if}

	<!-- Card Backs Dropdown -->
	{#if onCardBacksChange}
		<Dropdown
			label="Card Backs"
			value={cardBacksVisible ? 'visible' : 'hidden'}
			options={CARD_BACKS_OPTIONS}
			onChange={handleCardBacksChange}
			size="sm"
		/>
	{/if}

	<!-- Image Style Dropdown -->
	{#if onImageStyleChange}
		<Dropdown
			label="Image Style"
			value={imageStyle || 'classic'}
			options={IMAGE_STYLE_OPTIONS}
			onChange={handleImageStyleChange}
			size="sm"
		/>
	{/if}

	<!-- Genre -->
	{#if genre}
		<Badge variant="default" size="sm">{genre}</Badge>
	{/if}

	<!-- Published Badge -->
	{#if published}
		<Badge variant="success" size="sm" icon="🌍">Published</Badge>
	{/if}

	<!-- Share Count -->
	{#if shareCount !== undefined && shareCount > 0}
		<Badge variant="neutral" size="sm">
			{shareCount}
			{shareCount === 1 ? 'share' : 'shares'}
		</Badge>
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
