<script lang="ts">
	import type { Deck, Layout } from '$lib/next/types/deck.js';
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import { track } from '@vercel/analytics';

	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import DeckPreview from '$lib/next/components/preview/DeckPreview.svelte';
	import PrintLayout from '$lib/next/components/print/PrintLayout.svelte';
	import DeckMetadata from '$lib/next/components/nav/DeckMetadata.svelte';
	import AiBatchImageGenerationDialog from '$lib/next/components/dialogs/AiBatchImageGenerationDialog.svelte';

	import { page } from '$app/stores';
	import { user } from '$lib/next/stores/auth';
	import { nextDb } from '$lib/next/stores/database.js';
	import { toasts } from '$lib/stores/toast.js';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.ts';
	import { importFromUrl } from '$lib/next/utils/shareUrlUtils.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.ts';
	import { CardEditDialog, DeleteDeckDialog } from '$lib/next/components/dialogs/';
	import { goto, replaceState } from '$app/navigation';
	import MergeTool from '$lib/next/components/merge/MergeTool.svelte';
	import { performThreeLayerMerge } from '$lib/next/utils/threeLayerMerge.js';
	import {
		detectDeckConflict,
		type DeckConflict,
		type MergeResolution,
		applyMergeResolution
	} from '$lib/next/utils/deckMerging.js';
	import DeckActions from '$lib/next/components/nav/DeckActions.svelte';
	import ActionBar from '$lib/next/components/actions/ActionBar.svelte';
	import ActionButton from '$lib/next/components/actions/ActionButton.svelte';
	import { actionButtonContent } from '$lib/next/components/actions/actionButtonContent';
	import { Share2, Upload, Eye, Heart, Plus, Wand2, BookPlus, BookCheck } from 'lucide-svelte';

	// Server-side data
	let { data }: { data: PageData } = $props();

	let error = $state<string | null>(null);
	let loading = $state(true);
	let conflict = $state<DeckConflict | null>(null);
	let imported = $state(false);
	let importing = $state(false);
	let previewing = $state(false);
	let previewDeck = $state<Deck | null>(null);

	// Deck sources (for conditional UI logic)
	let hashDeck = $state<Deck | null>(null);
	let localDeck = $state<Deck | null>(null);

	// Check if we're in gallery view (either forced with ?gallery=true or viewing a curated deck)
	let isGalleryView = $derived(
		$page.url.searchParams.get('gallery') === 'true' || !!data.curatedDeck
	);

	// Check if user owns the curated deck (for showing publish/update button)
	let ownsPublishedDeck = $derived(
		data.curatedDeck && $user?.id && data.curatedDeck.user_id === $user.id
	);

	// Check if local deck has unpublished changes (needs republish)
	let needsRepublish = $derived.by(() => {
		if (!localDeck || !localDeck.meta.published_deck_id) return false;

		// Use activeDeck for reactivity - updates automatically when store changes
		const deck = activeDeck || localDeck;

		// Compare timestamps: has deck been edited since last publish?
		return deck.meta.lastPublished
			? deck.meta.lastEdited > deck.meta.lastPublished
			: true; // Never published but has published_deck_id
	});

	// Print mode state
	let isPrintMode = $state(false);
	let layout = $state<Layout>('poker');
	let showCardBacks = $state(true);
	let printEventTimeout: ReturnType<typeof setTimeout> | null = null;

	// Active deck - switches from previewDeck to store deck after import
	// This ensures Canon Update reactivity works after editing
	let activeDeck = $derived(
		nextDeckStore.deck && previewDeck && nextDeckStore.deck.id === previewDeck.id
			? nextDeckStore.deck
			: previewDeck
	);

	// Load deck function (extracted for reuse)
	async function loadDeckPreview() {
		loading = true;
		error = null;

		try {
			if (typeof window === 'undefined') {
				error = 'Preview functionality requires browser environment';
				return;
			}

			// Check if ?gallery=true is set to force gallery view (skip loading local)
			const forceGalleryView = $page.url.searchParams.get('gallery') === 'true';

			// PREPARE PREVIEW (don't import yet)
			// Layer 1: Curated deck from Supabase (if present)
			const curatedDeck = data.curatedDeck;
			console.log('[Preview] Curated deck:', curatedDeck);

			// Layer 2: Hash data from URL (shared modifications)
			console.log('[Preview] Current URL:', window.location.href);
			hashDeck = importFromUrl(window.location.href);
			console.log('[Preview] Hash deck:', hashDeck);

			// Layer 3: Local deck from IndexedDB (if exists and not forcing gallery view)
			if (!forceGalleryView) {
				if (curatedDeck) {
					// Check if user has a local copy of this curated deck
					localDeck = await nextDb.getDeck(curatedDeck.id);
				} else if (hashDeck) {
					// Check if user has a local copy of the hash deck
					localDeck = await nextDb.getDeck(hashDeck.id);
				} else {
					// No curated or hash deck - try to load from local DB using slug as ID
					console.log('[Preview] No curated/hash deck, trying local DB with slug:', data.slug);
					localDeck = await nextDb.getDeck(data.slug);
				}
			} else {
				console.log('[Preview] Gallery view forced - skipping local deck load');
				localDeck = null;
			}

			// Perform the three-layer merge for preview
			if (curatedDeck || hashDeck) {
				const mergeResult = performThreeLayerMerge(curatedDeck, hashDeck, localDeck);

				previewDeck = mergeResult.deck;
				previewing = true;

				// Store conflict info for later if needed
				if (mergeResult.hasConflict && mergeResult.conflict) {
					conflict = mergeResult.conflict;
				}

				// Keep the hash in URL during preview - we'll clear it after import
			} else if (localDeck) {
				// Pure local deck view (navigated directly to /{deck-id})
				previewDeck = localDeck;
				previewing = true;
				console.log('[Preview] Loaded pure local deck:', localDeck);
			} else {
				error = 'No deck data found';
				toasts.error('Deck not found');
			}
		} catch (err) {
			console.error('Preview error:', err);
			error = err instanceof Error ? err.message : 'Failed to load deck preview';
			toasts.error('Failed to load deck preview');
		} finally {
			loading = false;
		}
	}

	// Watch for slug changes and reload deck
	$effect(() => {
		// React to slug changes
		const currentSlug = data.slug;
		loadDeckPreview();
	});

	onMount(() => {
		// Run async work in a detached async IIFE so onMount returns cleanup synchronously
		(async () => {
			// Track shared deck access with Vercel Web Analytics
			try {
				track('shared_deck_accessed', {
					slug: data.slug,
					curated: !!data.curatedDeck,
					timestamp: new Date().toISOString(),
					referrer: document.referrer || 'direct'
				});
			} catch (error) {
				console.warn('Analytics tracking failed:', error);
			}

			// Initial load happens via $effect above
		})();

		// Set up print event listeners
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

	// Handle import action (triggered by user button click)
	async function handleImport() {
		if (!previewDeck) return;

		// Check if deck already exists locally
		if (localDeck) {
			const confirmed = confirm(
				`"${previewDeck.meta.title}" is already in your library.\n\n` +
					`Clicking OK will overwrite your local copy with the gallery version.\n\n` +
					`To create a separate copy, use the Duplicate Deck feature in your Dashboard instead.`
			);

			if (!confirmed) {
				return; // User cancelled
			}
		}

		importing = true;
		try {
			if (conflict && !localDeck) {
				// Has conflicts - show merge tool in dialog (but not if we're deliberately overwriting)
				dialogStore.setContent(MergeTool, {
					conflict,
					onResolve: handleMergeResolve,
					onCancel: handleMergeCancel
				});
				toasts.info(
					`⚠️ Deck "${previewDeck.meta.title}" has local changes. Please resolve conflicts.`
				);
			} else {
				// No conflicts or user confirmed overwrite - import directly
				await nextDeckStore.importDeck(previewDeck);

				// Switch from preview to success screen
				previewing = false;
				imported = true;

				// Clear the URL hash after successful import
				replaceState(window.location.pathname, {});

				if (localDeck) {
					toasts.success(`✅ Deck "${previewDeck.meta.title}" updated from gallery version!`);
				} else {
					toasts.success(`❤️ Deck "${previewDeck.meta.title}" liked and added to your collection!`);
				}
			}
		} catch (err) {
			console.error('Import error:', err);
			error = err instanceof Error ? err.message : 'Failed to import deck';
			toasts.error('Failed to import deck');
		} finally {
			importing = false;
		}
	}

	// Handle merge resolution
	async function handleMergeResolve(resolution: MergeResolution) {
		if (!conflict) return;

		try {
			// Apply the merge resolution to create the final deck
			const mergedDeck = applyMergeResolution(resolution);

			// Save the merged deck (will overwrite existing)
			await nextDb.upsertDeck(mergedDeck);

			// Load it into the store
			await nextDeckStore.loadDeck(mergedDeck.id);

			// Close dialog and update state
			dialogStore.close();
			imported = true;
			conflict = null;

			toasts.success(`🔀 Deck "${mergedDeck.meta.title}" merged successfully!`);
		} catch (err) {
			console.error('Merge error:', err);
			error = err instanceof Error ? err.message : 'Failed to merge deck';
			toasts.error('Failed to merge deck');
		}
	}

	function handleMergeCancel() {
		dialogStore.close();
		conflict = null;
		goto('/');
	}

	// Extract the slug for display
	let slug = $derived($page.params.slug || '');
	let decodedSlug = $derived(decodeURIComponent(slug));

	// Count images in deck
	function countImages(deck: Deck): number {
		return deck.cards.filter((card) => card.image || card.imageBlob).length;
	}

	// Handle download JSON
	function handleDownloadJson() {
		if (!previewDeck) return;
		const json = JSON.stringify(previewDeck, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${previewDeck.meta.title}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toasts.success('📥 Deck exported as JSON');
	}

	// Print event handlers
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
		}, 200);
	}

	// Handle layout change
	function handleLayoutChange(newLayout: Layout) {
		layout = newLayout;
	}

	// Handle card backs toggle
	function handleCardBacksChange(visible: boolean) {
		showCardBacks = visible;
	}

	// Handle edit card - implicitly imports deck if needed
	async function handleEdit(cardId: string) {
		if (!previewDeck) return;

		try {
			// Check if this deck is already loaded in the store
			const currentDeck = nextDeckStore.deck;
			const isDeckLoaded = currentDeck && currentDeck.id === previewDeck.id;

			if (!isDeckLoaded) {
				// Silently import the deck first
				await nextDeckStore.importDeck(previewDeck);

				// Clear the URL hash since we've now imported
				replaceState(window.location.pathname, {});

				toasts.success(`🎉 Deck "${previewDeck.meta.title}" added to your collection!`);
			}

			// Now open the edit dialog - card will exist in store
			dialogStore.setContent(CardEditDialog, { cardId });
		} catch (err) {
			console.error('Failed to import deck for editing:', err);
			toasts.error('Failed to open editor');
		}
	}

	// Handle publish deck
	let publishing = $state(false);
	async function handlePublish() {
		if (!previewDeck) return;

		publishing = true;
		try {
			// Determine if this is an update or new publish
			const isUpdate = ownsPublishedDeck && data.curatedDeck;

			// Load the deck into store if not already loaded
			const currentDeck = nextDeckStore.deck;
			const isDeckLoaded = currentDeck && currentDeck.id === previewDeck.id;

			if (!isDeckLoaded) {
				await nextDeckStore.loadDeck(previewDeck.id);
			}

			// Publish or update the deck
			const result = await nextDeckStore.publishDeck({
				visibility: 'public'
			});

			if (result.success && result.slug) {
				if (isUpdate) {
					toasts.success(`✅ Published version updated! Changes live at /${result.slug}`);
				} else {
					toasts.success(`🌍 Deck published! Visible in gallery at /${result.slug}`);
				}
			} else {
				toasts.error(result.error || 'Failed to publish deck');
			}
		} catch (err) {
			console.error('Failed to publish deck:', err);
			toasts.error('Failed to publish deck');
		} finally {
			publishing = false;
		}
	}

	// Handle batch image generation - loads deck into store if needed
	async function handleGenerateImages() {
		if (!previewDeck) return;

		try {
			// Check if this deck is already loaded in the store
			const currentDeck = nextDeckStore.deck;
			const isDeckLoaded = currentDeck && currentDeck.id === previewDeck.id;

			if (!isDeckLoaded) {
				// For local decks: load from IndexedDB
				// For curated/shared decks: import first
				if (localDeck) {
					// Local deck - just load it into the store
					await nextDeckStore.loadDeck(previewDeck.id);
				} else {
					// Curated/shared deck - import to IndexedDB first
					await nextDeckStore.importDeck(previewDeck);
					replaceState(window.location.pathname, {});
					toasts.success(`🎉 Deck "${previewDeck.meta.title}" added to your collection!`);
				}
			}

			// Now open the batch generation dialog - deck is loaded in store
			dialogStore.setContent(AiBatchImageGenerationDialog, {});
		} catch (err) {
			console.error('Failed to load deck for image generation:', err);
			toasts.error('Failed to open image generator');
		}
	}

	// Handle add card - implicitly imports deck if needed
	async function handleAddCard() {
		if (!previewDeck) return;

		try {
			// Check if this deck is already loaded in the store
			const currentDeck = nextDeckStore.deck;
			const isDeckLoaded = currentDeck && currentDeck.id === previewDeck.id;

			if (!isDeckLoaded) {
				// Silently import the deck first
				await nextDeckStore.importDeck(previewDeck);

				// Clear the URL hash since we've now imported
				replaceState(window.location.pathname, {});

				toasts.success(`🎉 Deck "${previewDeck.meta.title}" added to your collection!`);
			}

			// Create a new card first, then open dialog to edit it
			const newCard = await nextDeckStore.addCard({});
			if (newCard) {
				dialogStore.setContent(CardEditDialog, { cardId: newCard.id });
			} else {
				toasts.error('Failed to create card');
			}
		} catch (err) {
			console.error('Failed to add card:', err);
			toasts.error('Failed to add card');
		}
	}

	// Handle title edit - implicitly imports deck if needed
	async function handleTitleEdit() {
		if (!previewDeck) return;

		try {
			// Check if this deck is already loaded in the store
			const currentDeck = nextDeckStore.deck;
			const isDeckLoaded = currentDeck && currentDeck.id === previewDeck.id;

			if (!isDeckLoaded) {
				// Silently import the deck first
				await nextDeckStore.importDeck(previewDeck);

				// Clear the URL hash since we've now imported
				replaceState(window.location.pathname, {});
			}

			// Prompt for new title
			const newTitle = prompt('Enter new deck title:', previewDeck.meta.title);
			if (newTitle && newTitle.trim() !== '' && newTitle !== previewDeck.meta.title) {
				await nextDeckStore.updateDeckMeta({ title: newTitle.trim() });
				toasts.success('✏️ Deck title updated');
			}
		} catch (err) {
			console.error('Failed to edit title:', err);
			toasts.error('Failed to edit title');
		}
	}

	// Handle view in gallery - opens published version in new tab
	function handleViewInGallery() {
		const slug = data.curatedDeck?.slug || localDeck?.meta?.published_slug;
		if (!slug) {
			toasts.error('Published version not available. Try refreshing the page.');
			return;
		}
		window.open(`/${slug}?gallery=true`, '_blank');
	}

	// Handle share - copy gallery URL to clipboard
	async function handleShare() {
		const slug = isGalleryView
			? data.slug
			: data.curatedDeck?.slug || activeDeck?.meta?.published_slug;

		if (!slug) {
			console.error('[Share] No slug found', { isGalleryView, activeDeck: activeDeck?.meta });
			toasts.error('Cannot share - deck not published');
			return;
		}

		const url = `${window.location.origin}/${slug}`;

		try {
			await navigator.clipboard.writeText(url);
			toasts.success('🔗 Link copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
			toasts.error('Failed to copy link');
		}
	}

	// Handle delete deck - shows confirmation dialog
	function handleDeleteDeck() {
		if (!activeDeck) return;

		dialogStore.setContent(DeleteDeckDialog, {
			deck: activeDeck,
			onConfirm: async () => {
				try {
					// Delete from IndexedDB
					await nextDb.deleteDeck(activeDeck.id);

					// If this was a published deck that we owned, optionally unpublish
					// (For now, we just delete locally and navigate away)

					toasts.success(`🗑️ Deck "${activeDeck.meta.title}" deleted`);

					// Navigate to home/dashboard
					goto('/');
				} catch (err) {
					console.error('Failed to delete deck:', err);
					toasts.error('Failed to delete deck');
					throw err; // Re-throw to keep dialog open
				}
			}
		});
	}
</script>

<div class="import-page">
	{#if previewing && activeDeck}
		<!-- Preview mode with deck viewer -->
		<MainHeader
			title={activeDeck.meta.title}
			onTitleEdit={localDeck ? handleTitleEdit : undefined}
			{isGalleryView}
		>
			{#snippet metadata()}
				<DeckMetadata
					cardCount={activeDeck.cards.length}
					imageCount={countImages(activeDeck)}
					published={true}
					cardBacksVisible={showCardBacks}
					onCardBacksChange={handleCardBacksChange}
				/>
			{/snippet}
		</MainHeader>

		<!-- Action Bar - context-sensitive action buttons -->
		<ActionBar>
			{#if isGalleryView}
				<!-- Gallery view: Like, Add to Library, Share -->
				<!-- Like button (read-only, shows count) -->
				<ActionButton
					icon={Heart}
					{...actionButtonContent.like}
					variant="danger"
					filled={false}
					disabled
				/>

				<!-- Add to Library button -->
				<ActionButton
					icon={localDeck ? BookCheck : BookPlus}
					{...localDeck ? actionButtonContent.removeFromLibrary : actionButtonContent.addToLibrary}
					variant={localDeck ? 'success' : 'primary'}
					onclick={handleImport}
					disabled={importing}
				/>

				<!-- Share button -->
				<ActionButton
					icon={Share2}
					{...actionButtonContent.share}
					variant="primary"
					onclick={handleShare}
				/>
			{:else if localDeck}
				<!-- Local slug view: Full owner actions -->
				<!-- Check if published -->
				{#if activeDeck?.meta?.published_deck_id || activeDeck?.meta?.published_slug}
					<!-- Published deck actions -->

					<!-- Republish button - only show if local changes exist -->
					{#if needsRepublish}
						<ActionButton
							icon={Upload}
							{...actionButtonContent.republish}
							variant="warning"
							onclick={handlePublish}
							disabled={publishing}
						/>
					{/if}

					<!-- Like count (read-only for your own deck) -->
					<ActionButton
						icon={Heart}
						title="Likes"
						subtitle={`${data.curatedDeck?.like_count || 0} likes`}
						variant="danger"
						filled={false}
						disabled
					/>

					<ActionButton
						icon={Eye}
						{...actionButtonContent.viewPublic}
						variant="secondary"
						onclick={handleViewInGallery}
					/>

					<ActionButton
						icon={Share2}
						{...actionButtonContent.share}
						variant="primary"
						onclick={handleShare}
					/>
				{:else}
					<!-- Unpublished deck - show publish button -->
					<ActionButton
						icon={Upload}
						{...actionButtonContent.publish}
						variant="success"
						onclick={handlePublish}
						disabled={publishing}
					/>
				{/if}

				<!-- Always show generate and add card -->
				{#if $user}
					<ActionButton
						icon={Wand2}
						{...actionButtonContent.generateImages}
						variant="success"
						onclick={handleGenerateImages}
					/>
				{/if}

				<ActionButton
					icon={Plus}
					{...actionButtonContent.addCard}
					variant="primary"
					onclick={handleAddCard}
				/>
			{/if}
		</ActionBar>

		<!-- Deck viewer - switches to print layout when printing -->
		<div class="preview-content">
			{#if isPrintMode}
				<PrintLayout cards={activeDeck.cards} {layout} {showCardBacks} />
			{:else}
				<DeckPreview deck={activeDeck} onEdit={handleEdit} />
			{/if}
		</div>
	{:else}
		<!-- Loading/Error states -->
		<div class="import-content">
			{#if loading}
				<div class="importing">
					<div class="spinner"></div>
					<h2>🔗 Loading Deck</h2>
					<p>Preparing preview...</p>
					{#if decodedSlug}
						<p class="slug">"{decodedSlug}"</p>
					{/if}
				</div>
			{:else if imported}
				<div class="success">
					<div class="checkmark">✅</div>
					<h2>🎉 Added to Collection!</h2>
					<p>Deck saved to your collection.</p>
					<button class="success-button" onclick={() => goto('/')}> Open Deck </button>
				</div>
			{:else if error}
				<div class="error">
					<div class="error-icon">❌</div>
					<h2>Load Failed</h2>
					<p>{error}</p>
					<button class="retry-button" onclick={() => goto('/')}> Go to App </button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Dialog system for editing cards -->
<Dialog />

<style>
	.import-page {
		min-height: 100vh;
		align-items: center;
		justify-content: center;
		background: var(--ui-bg, #ffffff);
		font-family: var(--ui-font-family, system-ui);
	}

	.import-content {
		text-align: center;
		padding: 2rem;
		max-width: 400px;
	}

	.importing,
	.success,
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--ui-border, #e2e8f0);
		border-top: 3px solid var(--button-primary-bg, #3b82f6);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.checkmark {
		font-size: 3rem;
		animation: bounce 0.6s ease-out;
	}

	@keyframes bounce {
		0% {
			transform: scale(0.3);
		}
		50% {
			transform: scale(1.05);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1);
		}
	}

	.error-icon {
		font-size: 3rem;
		color: var(--toast-error, #dc2626);
	}

	h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
	}

	p {
		margin: 0;
		color: var(--ui-muted, #64748b);
		line-height: 1.5;
	}

	.slug {
		font-family: monospace;
		background: var(--ui-hover-bg, #f8fafc);
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.9rem;
		word-break: break-all;
		border: 1px solid var(--ui-border, #e2e8f0);
	}

	.retry-button,
	.success-button {
		padding: 0.75rem 1.5rem;
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.retry-button:hover,
	.success-button:hover {
		background: var(--button-primary-hover-bg, #2563eb);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.success-button {
		background: var(--toast-success, #10b981);
	}

	.success-button:hover {
		background: var(--toast-success, #059669);
	}

	/* Preview content */
	.preview-content {
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: 0 2rem 2rem;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.preview-content {
			padding: 0 1rem 1rem;
		}
	}

	@media print {
		.preview-content {
			padding: 0;
		}
	}
</style>
