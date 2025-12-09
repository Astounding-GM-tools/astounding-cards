<script lang="ts">
	import type { Card as CardType } from '../../types/card.js';
	import Card from './Card.svelte';
	import CardFrontContent from './CardFrontContent.svelte';
	import CardBackContent from './CardBackContent.svelte';

	interface Props {
		card: CardType;
		showBack?: boolean;
		onClick?: (cardId: string) => void;
	}

	let { card, showBack = false, onClick }: Props = $props();

	function handleClick() {
		if (onClick) {
			onClick(card.id);
		}
	}
</script>

<CardContainer>
	<div
		class="card-preset-trading"
		class:clickable={!!onClick}
		onclick={handleClick}
		role={onClick ? 'button' : undefined}
		tabindex={onClick ? 0 : undefined}
	>
		{#if showBack}
			<CardBackContent {card} />
		{:else}
			<CardFrontContent {card} />
		{/if}
	</div>
</CardContainer>

<style>
	.card-preset-trading {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.clickable {
		cursor: pointer;
	}
</style>
