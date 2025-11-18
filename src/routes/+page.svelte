<script lang="ts">
	import type { ImageStyle } from '$lib/next/types/deck.js';

	import Card from '$lib/next/components/card/Card.svelte';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import DeckActions from '$lib/next/components/nav/DeckActions.svelte';
	import DeckMetadata from '$lib/next/components/nav/DeckMetadata.svelte';
	import MobileCardList from '$lib/next/components/page/MobileCardList.svelte';
	import CardBackContent from '$lib/next/components/card/CardBackContent.svelte';
	import CardFrontContent from '$lib/next/components/card/CardFrontContent.svelte';
	import AiBatchImageGenerationDialog from '$lib/next/components/dialogs/AiBatchImageGenerationDialog.svelte';

	import { toasts } from '$lib/stores/toast.js';
	import { nextDb } from '$lib/next/stores/database.js';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.js';
	import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { generateShareUrl } from '$lib/next/utils/shareUrlUtils.js';
	import { importFromCurrentUrl } from '$lib/next/utils/shareUrlUtils.js';
	import { CardEditDialog, ImageMigrationDialog } from '$lib/next/components/dialogs/index.js';

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
	let imageStyle = $derived(deck?.meta.imageStyle || 'classic');

	// Simple card count for UI logic
	let cardCount = $derived(cards?.length || 0);

	// Deck switcher state
	let allDecks = $state<(typeof deck)[]>([]);

	// Load all decks for the switcher
	async function loadAllDecks() {
		try {
			const decks = await nextDb.getAllDecks();
			allDecks = decks;
		} catch (error) {
			console.error('Failed to load decks:', error);
		}
	}

	// Handle deck selection from switcher
	async function handleSelectDeck(deckId: string) {
		await nextDeckStore.selectDeck(deckId);
		await loadAllDecks(); // Refresh deck list
	}

	// Handle new deck creation from switcher
	async function handleNewDeck() {
		const newDeck = await nextDeckStore.createNewDeck();
		if (newDeck) {
			await loadAllDecks(); // Refresh deck list
			toasts.success('✅ New deck created!');
		}
	}

	// Handler functions for header actions
	async function handleAddCard() {
		const newCard = await nextDeckStore.addCard();
		if (newCard) {
			dialogStore.setContent(CardEditDialog, { cardId: newCard.id });
		}
	}

	async function handleShareDeck() {
		if (!deck) return;
		try {
			const needsMigration = checkImageMigrationNeeded(deck);
			if (!needsMigration) {
				const shareUrl = generateShareUrl(deck);
				await navigator.clipboard.writeText(shareUrl);
				toasts.success('🔗 Share URL copied to clipboard!');
			} else {
				dialogStore.setContent(ImageMigrationDialog, {
					deck,
					onMigrationComplete: handleMigrationComplete
				});
			}
		} catch (error) {
			toasts.error('Failed to share deck');
		}
	}

	function checkImageMigrationNeeded(deck: typeof deck): boolean {
		return deck.cards.some((card) => {
			if (!card.image && !card.imageBlob) return false;
			if (card.image && isValidExternalUrl(card.image)) return false;
			return card.imageBlob || (card.image && !isValidExternalUrl(card.image));
		});
	}

	function isValidExternalUrl(url?: string | null): boolean {
		if (!url) return false;
		try {
			const parsedUrl = new URL(url);
			return (
				(parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
				parsedUrl.hostname !== 'localhost' &&
				parsedUrl.hostname !== '127.0.0.1' &&
				!parsedUrl.protocol.startsWith('blob:') &&
				!parsedUrl.protocol.startsWith('data:')
			);
		} catch {
			return false;
		}
	}

	async function handleMigrationComplete(
		migrationData: Record<string, { url: string; metadata: any }>
	) {
		try {
			if (!deck) throw new Error('No deck loaded');
			const cardUpdates = Object.entries(migrationData).map(([cardId, migration]) => ({
				cardId,
				updates: {
					image: migration.url,
					imageBlob: null,
					imageMetadata: migration.metadata
				}
			}));
			const { nextDb } = await import('$lib/next/stores/database.js');
			const updatedDeck = await nextDb.updateMultipleCards(deck.id, cardUpdates);
			await nextDeckStore.loadDeck(updatedDeck.id);
			const freshDeck = await nextDb.getDeck(updatedDeck.id);
			if (!freshDeck) throw new Error('Failed to fetch updated deck');
			const shareUrl = generateShareUrl(freshDeck);
			await navigator.clipboard.writeText(shareUrl);
			toasts.success('🎉 Images migrated and share URL copied!');
			dialogStore.close();
		} catch (error) {
			toasts.error('Migration complete, but failed to generate share URL');
		}
	}

	async function handleExportJson() {
		if (!deck) return;
		const json = JSON.stringify(deck, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${deck.meta.title.replace(/[^a-z0-9]/gi, '_')}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toasts.success('Deck exported as JSON');
	}

	function handlePublish() {
		toasts.info('Publishing to gallery - coming soon!');
	}

	function handleGenerateDeck() {
		toasts.info('Full deck generation - coming soon!');
	}

	function handleGenerateImages() {
		dialogStore.setContent(AiBatchImageGenerationDialog);
	}

	function handleImportCards() {
		toasts.info('Import cards - coming soon!');
	}

	function handleDuplicateDeck() {
		toasts.info('Duplicate deck - coming soon!');
	}

	function handleDeleteDeck() {
		toasts.info('Delete deck - coming soon!');
	}

	function handleCardBacksChange(visible: boolean) {
		showCardBacks = visible;
	}

	async function handleImageStyleChange(style: ImageStyle) {
		await nextDeckStore.updateImageStyle(style);
	}

	function handleTitleEdit() {
		// TODO: Open title edit dialog
		toasts.info('Title editing - coming soon!');
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

	onMount(async () => {
		await initializePage();
		await loadAllDecks(); // Load decks for switcher

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
	<MainHeader
		title={deckTitle}
		onTitleEdit={handleTitleEdit}
		showDeckSwitcher={true}
		decks={allDecks}
		currentDeckId={deck?.id}
		onSelectDeck={handleSelectDeck}
		onNewDeck={handleNewDeck}
	>
		{#snippet metadata()}
			{#if deck}
				<DeckMetadata
					{cardCount}
					{imageStyle}
					onImageStyleChange={handleImageStyleChange}
					cardBacksVisible={showCardBacks}
					onCardBacksChange={handleCardBacksChange}
				/>
			{/if}
		{/snippet}

		{#snippet actions()}
			{#if deck}
				<DeckActions
					onAddCard={handleAddCard}
					onShare={handleShareDeck}
					onExportJson={handleExportJson}
					onPublish={handlePublish}
					onGenerateDeck={handleGenerateDeck}
					onGenerateImages={handleGenerateImages}
					onImportCards={handleImportCards}
					onDuplicateDeck={handleDuplicateDeck}
					onDeleteDeck={handleDeleteDeck}
					disabled={nextDeckStore.isLoading}
				/>
			{/if}
		{/snippet}
	</MainHeader>

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
