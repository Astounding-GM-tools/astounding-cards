<script lang="ts">
	import type { Card as CardType } from '../../types/card.js';
	import type { Layout } from '../../types/deck.js';
	import Card from '../card/Card.svelte';
	import CardFrontContent from '../card/CardFrontContent.svelte';
	import CardBackContent from '../card/CardBackContent.svelte';

	interface Props {
		cards: CardType[];
		layout: Layout;
		showCardBacks?: boolean;
		debugMode?: boolean; // When true, show print styles on screen for debugging
	}

	let { cards, layout, showCardBacks = true, debugMode = false }: Props = $props();

	// Working pagination function (from old PagedCards)
	function getPagedCards(cards: CardType[], layout: Layout) {
		const cardsPerPage = layout === 'poker' ? 9 : 4;
		const pages = [];

		for (let i = 0; i < cards.length; i += cardsPerPage) {
			pages.push(cards.slice(i, i + cardsPerPage));
		}

		return pages;
	}

	let pagedCards = $derived(getPagedCards(cards, layout));
</script>

<!-- Print layout: use working PagedCards component -->
<div class="print-layout" class:debug-mode={debugMode}>
	{#each pagedCards as page, pageIndex}
		<!-- Front page -->
		<div
			class="page"
			data-layout={layout}
			class:last-page={!showCardBacks && pageIndex === pagedCards.length - 1}
		>
			<div class="card-grid">
				{#each page as card (card.id)}
					<Card cardId={card.id}>
						<CardFrontContent {card} />
					</Card>
				{/each}
			</div>
		</div>

		<!-- Back page (if enabled) -->
		{#if showCardBacks}
			<div class="page" data-layout={layout} class:last-page={pageIndex === pagedCards.length - 1}>
				<div class="card-grid back-grid">
					{#each page as card (card.id)}
						<Card cardId={card.id}>
							<CardBackContent {card} />
						</Card>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	/* Working print layout CSS (from PagedCards) */
	.print-layout .page {
		/* Fluid sizing - works with any paper size (A4, Letter, Legal, etc.) */
		width: 100%;
		min-height: 100vh; /* Fill the page height */
		margin: 0 auto 20mm;
		padding: 10mm; /* Padding ensures crop marks stay within printable area */
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		position: relative;
		page-break-after: always;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.print-layout .card-grid {
		width: 100%;
		height: 100%;
		display: grid;
		gap: 0;
	}

	/* Tarot layout: 2x2 grid */
	.print-layout .page[data-layout='tarot'] .card-grid {
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
	}

	/* Poker layout: 3x3 grid */
	.print-layout .page[data-layout='poker'] .card-grid {
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
	}

	/* Back page - reverse for double-sided printing */
	.print-layout .back-grid {
		direction: rtl;
	}

	.print-layout .back-grid :global(.card) {
		direction: ltr;
	}

	/* Remove page break from last page to prevent blank page */
	.print-layout .last-page {
		page-break-after: auto;
	}

	/* Ensure crop marks use border-box sizing in print layout */
	.print-layout :global(.crop-mark) {
		box-sizing: border-box !important;
	}

	/* Print-specific styles */
	@media print {
		/* Remove browser's default print page margins */
		@page {
			margin: 0;
		}

		.print-layout .page {
			margin: 0;
			padding: 10mm; /* Keep padding so crop marks stay visible */
			box-shadow: none;
			page-break-after: always;
		}

		.print-layout .last-page {
			page-break-after: auto;
		}

		/* Hide all headers when printing */
		:global(.app-header) {
			display: none !important;
		}
	}

	/* Debug mode: show print styles on screen (toggle with debugMode prop) */
	.print-layout.debug-mode .page {
		margin: 0 auto 2rem; /* Add spacing between pages for screen viewing */
		padding: 10mm;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		outline: 2px dashed red; /* Visual indicator of page boundaries */
	}

	.print-layout.debug-mode .last-page {
		page-break-after: auto;
	}

	/* CROP MARKS: Show when printing OR in debug mode */
	@media print {
		/* TAROT LAYOUT (2x2 grid) */

		/* TAROT LAYOUT (2x2 grid) */
		/* Top edge: cards 1,2 show both top crop marks */
		.print-layout .page[data-layout='tarot'] :global(.card:nth-child(-n + 2) .crop-mark.top-left),
		.print-layout .page[data-layout='tarot'] :global(.card:nth-child(-n + 2) .crop-mark.top-right) {
			display: block;
		}

		/* Bottom edge: cards 3,4 show both bottom crop marks */
		.print-layout .page[data-layout='tarot'] :global(.card:nth-child(n + 3) .crop-mark.bottom-left),
		.print-layout
			.page[data-layout='tarot']
			:global(.card:nth-child(n + 3) .crop-mark.bottom-right) {
			display: block;
		}

		/* Left edge: cards 1,3 show both left crop marks */
		.print-layout .page[data-layout='tarot'] :global(.card:nth-child(odd) .crop-mark.top-left),
		.print-layout .page[data-layout='tarot'] :global(.card:nth-child(odd) .crop-mark.bottom-left) {
			display: block;
		}

		/* Right edge: cards 2,4 show both right crop marks */
		.print-layout .page[data-layout='tarot'] :global(.card:nth-child(even) .crop-mark.top-right),
		.print-layout
			.page[data-layout='tarot']
			:global(.card:nth-child(even) .crop-mark.bottom-right) {
			display: block;
		}

		/* POKER LAYOUT (3x3 grid) */
		/* Top edge: cards 1,2,3 show both top crop marks */
		.print-layout .page[data-layout='poker'] :global(.card:nth-child(-n + 3) .crop-mark.top-left),
		.print-layout .page[data-layout='poker'] :global(.card:nth-child(-n + 3) .crop-mark.top-right) {
			display: block;
		}

		/* Bottom edge: cards 7,8,9 show both bottom crop marks */
		.print-layout .page[data-layout='poker'] :global(.card:nth-child(n + 7) .crop-mark.bottom-left),
		.print-layout
			.page[data-layout='poker']
			:global(.card:nth-child(n + 7) .crop-mark.bottom-right) {
			display: block;
		}

		/* Left edge: cards 1,4,7 show both left crop marks */
		.print-layout .page[data-layout='poker'] :global(.card:nth-child(3n + 1) .crop-mark.top-left),
		.print-layout
			.page[data-layout='poker']
			:global(.card:nth-child(3n + 1) .crop-mark.bottom-left) {
			display: block;
		}

		/* Right edge: cards 3,6,9 show both right crop marks */
		.print-layout .page[data-layout='poker'] :global(.card:nth-child(3n) .crop-mark.top-right),
		.print-layout .page[data-layout='poker'] :global(.card:nth-child(3n) .crop-mark.bottom-right) {
			display: block;
		}
	}

	/* Debug mode: show same crop marks on screen */
	/* TAROT LAYOUT (2x2 grid) */
	.print-layout.debug-mode .page[data-layout='tarot'] :global(.card:nth-child(-n + 2) .crop-mark.top-left),
	.print-layout.debug-mode .page[data-layout='tarot'] :global(.card:nth-child(-n + 2) .crop-mark.top-right),
	.print-layout.debug-mode .page[data-layout='tarot'] :global(.card:nth-child(n + 3) .crop-mark.bottom-left),
	.print-layout.debug-mode .page[data-layout='tarot'] :global(.card:nth-child(n + 3) .crop-mark.bottom-right),
	.print-layout.debug-mode .page[data-layout='tarot'] :global(.card:nth-child(odd) .crop-mark.top-left),
	.print-layout.debug-mode .page[data-layout='tarot'] :global(.card:nth-child(odd) .crop-mark.bottom-left),
	.print-layout.debug-mode .page[data-layout='tarot'] :global(.card:nth-child(even) .crop-mark.top-right),
	.print-layout.debug-mode .page[data-layout='tarot'] :global(.card:nth-child(even) .crop-mark.bottom-right),
	/* POKER LAYOUT (3x3 grid) */
	.print-layout.debug-mode .page[data-layout='poker'] :global(.card:nth-child(-n + 3) .crop-mark.top-left),
	.print-layout.debug-mode .page[data-layout='poker'] :global(.card:nth-child(-n + 3) .crop-mark.top-right),
	.print-layout.debug-mode .page[data-layout='poker'] :global(.card:nth-child(n + 7) .crop-mark.bottom-left),
	.print-layout.debug-mode .page[data-layout='poker'] :global(.card:nth-child(n + 7) .crop-mark.bottom-right),
	.print-layout.debug-mode .page[data-layout='poker'] :global(.card:nth-child(3n + 1) .crop-mark.top-left),
	.print-layout.debug-mode .page[data-layout='poker'] :global(.card:nth-child(3n + 1) .crop-mark.bottom-left),
	.print-layout.debug-mode .page[data-layout='poker'] :global(.card:nth-child(3n) .crop-mark.top-right),
	.print-layout.debug-mode .page[data-layout='poker'] :global(.card:nth-child(3n) .crop-mark.bottom-right) {
		display: block;
	}

	/* Screen preview */
	@media screen {
		.print-layout {
			padding: 2rem 0;
		}

		.print-layout .page {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}
	}
</style>
