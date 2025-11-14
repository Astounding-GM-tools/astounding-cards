<script lang="ts">
	import MobileCardList from '$lib/next/components/page/MobileCardList.svelte';
	import AppHeader from '$lib/next/components/nav/Header.svelte';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import Card from '$lib/next/components/card/Card.svelte';
	import CardFrontContent from '$lib/next/components/card/CardFrontContent.svelte';
	import CardBackContent from '$lib/next/components/card/CardBackContent.svelte';

	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
	import { importFromCurrentUrl } from '$lib/next/utils/shareUrlUtils.js';
	import { toasts } from '$lib/stores/toast.js';
	import { onMount } from 'svelte';

	let isInitializing = $state(true);
	let showCardBacks = $state(true);
	let isPrintMode = $state(false);
	let printEventTimeout: number | null = null;

	// Get deck and derived state
	let deck = $derived(nextDeckStore.deck);
	let cards = $derived(deck?.cards || []);
	let deckTitle = $derived(deck?.meta.title || 'Sample Deck');
	let layout = $derived(deck?.meta.layout || 'tarot');

	// Simple card count for UI logic
	let cardCount = $derived(cards?.length || 0);

	// Handle card backs visibility toggle from header
	function handleCardBacksToggle(event: CustomEvent<boolean>) {
		showCardBacks = event.detail;
	}

	// Working pagination function (from old PagedCards)
	function getPagedCards(cards: any[], layout: string) {
		const cardsPerPage = layout === 'poker' ? 9 : 4;
		const pages = [];

		for (let i = 0; i < cards.length; i += cardsPerPage) {
			pages.push(cards.slice(i, i + cardsPerPage));
		}

		return pages;
	}

	async function loadSampleData() {
		try {
			return await nextDevStore.setupTestEnvironment();
		} catch (error) {
			console.error('Error loading sample data:', error);
			return false;
		}
	}

	async function initializePage() {
		try {
			// First priority: Check if there's a share URL to import
			const importedDeck = importFromCurrentUrl();
			if (importedDeck) {
				await nextDeckStore.loadDeck(importedDeck);
				toasts.success(`🎉 Deck "${importedDeck.meta.title}" imported from URL!`);
				// Clear the URL hash to prevent re-importing
				// Commented out to preserve URL during merge workflow
				// if (typeof window !== 'undefined') {
				//     window.history.replaceState({}, '', window.location.pathname);
				// }
				isInitializing = false;
				return;
			}

			// Check if we already have a deck loaded
			if (nextDeckStore.deck) {
				isInitializing = false;
				return;
			}

			// Second priority: Load the most recent deck from database
			const hasExistingDeck = await nextDeckStore.loadMostRecent();

			// Last resort: Create sample data if no existing deck
			if (!hasExistingDeck) {
				const success = await loadSampleData();
				if (!success) {
					console.warn('Failed to load sample data, but continuing...');
				}
			}
		} catch (error) {
			console.error('Error during page initialization:', error);
			toasts.error('Failed to initialize page');
		} finally {
			// Always set initializing to false, regardless of success/failure
			isInitializing = false;
		}
	}

	// Print event handlers for layout switching
	function handleBeforePrint() {
		// Clear any pending timeout
		if (printEventTimeout) {
			clearTimeout(printEventTimeout);
			printEventTimeout = null;
		}

		if (!isPrintMode) {
			isPrintMode = true;
		}
	}

	function handleAfterPrint() {
		// Clear any existing timeout
		if (printEventTimeout) {
			clearTimeout(printEventTimeout);
		}

		// Use a longer delay to ensure print dialog is fully closed
		printEventTimeout = setTimeout(() => {
			isPrintMode = false;
			printEventTimeout = null;
		}, 200); // Increased delay
	}

	onMount(() => {
		initializePage();

		// Set up print event listeners (no media query - it conflicts)
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeprint', handleBeforePrint);
			window.addEventListener('afterprint', handleAfterPrint);

			// Cleanup on component destroy
			return () => {
				window.removeEventListener('beforeprint', handleBeforePrint);
				window.removeEventListener('afterprint', handleAfterPrint);
			};
		}
	});
</script>

<section class="deck">
	<AppHeader on:cardBacksToggle={handleCardBacksToggle} />

	{#if isInitializing}
		<p>Initializing...</p>
	{:else if nextDeckStore.error}
		<p style="color: red;">❌ {nextDeckStore.error}</p>
	{:else if !deck && nextDeckStore.isLoading}
		<p>⏳ {nextDeckStore.loadingMessage}</p>
	{:else if cardCount === 0}
		<p>
			No cards found. <button onclick={() => nextDevStore.setupTestEnvironment()}
				>Load Sample Data</button
			>
		</p>
	{:else if deck}
		<!-- Show loading indicator but keep content visible during updates -->
		{#if nextDeckStore.isLoading}
			<div class="loading-overlay">⏳ {nextDeckStore.loadingMessage}</div>
		{/if}

		<!-- Conditional layout based on print mode -->
		{#if isPrintMode}
			<!-- Print layout: use working PagedCards component -->
			<div class="print-layout">
				{#each getPagedCards(cards, layout) as page, pageIndex}
					<!-- Front page -->
					<div
						class="page"
						data-layout={layout}
						class:last-page={!showCardBacks &&
							pageIndex === getPagedCards(cards, layout).length - 1}
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
						<div
							class="page"
							data-layout={layout}
							class:last-page={pageIndex === getPagedCards(cards, layout).length - 1}
						>
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
		{:else}
			<!-- Default layout: mobile-friendly card list -->
			<MobileCardList {cards} {layout} {showCardBacks} />
		{/if}
	{/if}
</section>

<!-- Dialog system for editing cards -->
<Dialog />

<style>
	.deck {
		margin: 20px auto;
		position: relative;
	}

	/* Working print layout CSS (from PagedCards) */
	.print-layout .page {
		width: 210mm;
		height: 297mm;
		margin: 0 auto 20mm;
		padding: 10mm;
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
	.print-layout .page.last-page {
		page-break-after: auto !important;
		margin-bottom: 0 !important;
	}

	/* Ensure crop marks use border-box sizing in print layout */
	.print-layout :global(.crop-mark) {
		box-sizing: border-box !important;
	}

	@media print {
		.print-layout .page {
			width: auto;
			height: auto;
			min-height: 100vh;
			margin: 0;
			box-shadow: none;
		}

		/* Ensure last page doesn't create blank page */
		.print-layout .page.last-page {
			page-break-after: auto !important;
		}

		/* CROP MARKS: Show all crop marks that touch page edges - ONLY WHEN PRINTING */

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

	.loading-overlay {
		position: fixed;
		top: 20px;
		right: 20px;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8px 16px;
		border-radius: 4px;
		z-index: 1000;
		font-size: 14px;
	}
	:global(.page),
	:global(.page *) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
	}

	/* Print styles - hide header when printing */
	@media print {
		:global(.app-header) {
			display: none !important;
		}

		.deck {
			margin: 0;
		}
	}
</style>
