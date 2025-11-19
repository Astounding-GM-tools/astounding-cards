<script lang="ts">
	import Card from './Card.svelte';
	import CardFrontContent from './CardFrontContent.svelte';
	import type { Card as CardType } from '../../types/card';

	const { card, preview = true, cardId }: { card: CardType; preview?: boolean; cardId?: string } =
		$props();
</script>

<div class="card-wrapper">
	<Card {preview} {cardId}>
		<CardFrontContent {card} />
	</Card>
</div>

<style>
	.card-wrapper {
		width: 280px;
		height: 392px;
		font-size: 14px;
	}
</style>
