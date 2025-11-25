<script lang="ts">
	import Card from './Card.svelte';
	import CardBackContent from './CardBackContent.svelte';
	import type { Card as CardType } from '../../types/card';

	const { card, preview = true }: { card: CardType; preview?: boolean } = $props();
</script>

<div class="card-wrapper">
	<Card {preview}>
		<CardBackContent {card} />
	</Card>
</div>

<style>
	.card-wrapper {
		width: 280px;
		height: 392px;
		font-size: 14px;
	}
</style>
