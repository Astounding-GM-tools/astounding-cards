<script lang="ts">
	import type { Card } from '../../types/card.js';
	import CardImage from '../image/CardImage.svelte';

	interface Props {
		card: Card;
		showBack?: boolean;
		onClick?: (cardId: string) => void;
	}

	let { card, showBack = false }: Props = $props();
</script>

<article class="card-preset-minimal">
	{#if showBack}
		<!-- Back: Description only -->
		<div class="minimal-back">
			{#if card.description}
				<p class="description">{card.description}</p>
			{/if}
		</div>
	{:else}
		<!-- Front: Image (optional), Title, Subtitle (optional) -->
		<div class="minimal-front">
			{#if card.image}
				<div class="image-container">
					<CardImage {card} />
				</div>
			{/if}

			<div class="text-content">
				{#if card.title}
					<h2 class="title">{card.title}</h2>
				{/if}

				{#if card.subtitle}
					<p class="subtitle">{card.subtitle}</p>
				{/if}
			</div>
		</div>
	{/if}
</article>

<style>
	.card-preset-minimal {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: white;
		border-radius: 0.5rem;
		overflow: hidden;
		position: relative;
		container-name: card;
		container-type: inline-size;
	}

	/* Front side */
	.minimal-front {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 5cqw;
		text-align: center;
		gap: 3cqw;
	}

	.image-container {
		flex-shrink: 0;
		width: 80%;
		height: auto;
		max-height: 60%;
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.image-container :global(img) {
		max-width: 100%;
		max-height: 60%;
		object-fit: contain;
		border-radius: 0.25rem;
	}

	.text-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 0;
	}

	.title {
		font-size: 8cqw;
		font-weight: 700;
		line-height: 1.2;
		margin: 0;
		color: #1e293b;
		word-wrap: break-word;
		hyphens: auto;
		text-wrap: balance;
	}

	.subtitle {
		font-size: 5cqw;
		font-weight: 400;
		line-height: 1.4;
		margin: 0;
		color: #64748b;
		word-wrap: break-word;
	}

	/* Back side */
	.minimal-back {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 6cqw;
	}

	.description {
		font-size: 4.5cqw;
		line-height: 1.6;
		color: #334155;
		margin: 0;
		text-align: center;
		max-width: 100%;
		overflow-wrap: break-word;
		text-wrap: balance;
	}

	/* Responsive sizing */
	@media (max-width: 768px) {
		.title {
			font-size: 1.5rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.description {
			font-size: 1rem;
		}

		.minimal-front {
			padding: 1rem;
		}

		.minimal-back {
			padding: 1.5rem;
		}
	}

	/* Print styles */
	@media print {
		.card-preset-minimal {
			break-inside: avoid;
			page-break-inside: avoid;
		}
	}
</style>
