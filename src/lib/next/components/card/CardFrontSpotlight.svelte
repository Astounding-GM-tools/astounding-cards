<script lang="ts">
	import type { Card } from '../../types/card.js';
	import CardImage from '../image/CardImage.svelte';

	interface Props {
		card: Card;
		deckTitle: string;
		index: number;
	}

	let { card, deckTitle, index }: Props = $props();
</script>

<fieldset
	id="card-content-spotlight"
	aria-label="Card content spotlight"
	class="card-content-spotlight"
>
	<label for="card-title-spotlight" class="sr-only">
		{deckTitle} &bull; #{index}
	</label>
	{#if card.image}
		<CardImage {card} />
	{/if}
	<h1>{card.title}</h1>
	<h2>{card.subtitle}</h2>
</fieldset>

<style>
	.card-content-spotlight {
		display: flex;
		flex-direction: column;
		margin: auto 0.8em 0.8em 0.8em;
		background: white;
		border-radius: 0.2em;
		box-shadow: 0 0 0.6em 0 rgba(0, 0, 0, 0.1);
		z-index: 10;
	}
</style>
