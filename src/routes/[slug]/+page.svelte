<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/stores';
	import { track } from '@vercel/analytics';
	import { importFromUrl } from '$lib/next/utils/shareUrlUtils.js';
	import { performThreeLayerMerge } from '$lib/next/utils/threeLayerMerge.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.ts';
	import { nextDb } from '$lib/next/stores/database.js';
	import { toasts } from '$lib/stores/toast.js';
	import {
		detectDeckConflict,
		type DeckConflict,
		type MergeResolution,
		applyMergeResolution
	} from '$lib/next/utils/deckMerging.js';
	import MergeTool from '$lib/next/components/merge/MergeTool.svelte';
	import DeckPreview from '$lib/next/components/preview/DeckPreview.svelte';
	import PrintLayout from '$lib/next/components/print/PrintLayout.svelte';
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import DeckMetadata from '$lib/next/components/nav/DeckMetadata.svelte';
	import { Copy, Download } from 'lucide-svelte';
	import type { Deck } from '$lib/next/types/deck.js';
	import type { Layout } from '$lib/next/types/deck.js';
	import type { PageData } from './$types';

	// Server-side data
	let { data }: { data: PageData } = $props();

	let loading = $state(true);
	let error = $state<string | null>(null);
	let previewing = $state(false);
	let importing = $state(false);
	let imported = $state(false);
	let showMergeTool = $state(false);
	let conflict = $state<DeckConflict | null>(null);
	let previewDeck = $state<Deck | null>(null);
	let importedDeck = $state<Deck | null>(null);

	// Print mode state
	let isPrintMode = $state(false);
	let layout = $state<Layout>('poker');
	let showCardBacks = $state(true);
	let printEventTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
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

		try {
			if (typeof window === 'undefined') {
				error = 'Preview functionality requires browser environment';
				return;
			}

			// PREPARE PREVIEW (don't import yet)
			// Layer 1: Curated deck from Supabase (if present)
			const curatedDeck = data.curatedDeck;
			console.log('[Preview] Curated deck:', curatedDeck);

			// Layer 2: Hash data from URL (shared modifications)
			console.log('[Preview] Current URL:', window.location.href);
			const hashDeck = importFromUrl(window.location.href);
			console.log('[Preview] Hash deck:', hashDeck);

			// Layer 3: Local deck from IndexedDB (if exists)
			let localDeck: Deck | null = null;
			if (curatedDeck) {
				// Check if user has a local copy of this curated deck
				localDeck = await nextDb.getDeck(curatedDeck.id);
			} else if (hashDeck) {
				// Check if user has a local copy of the hash deck
				localDeck = await nextDb.getDeck(hashDeck.id);
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
			} else {
				error = 'No deck data found in URL';
				toasts.error('No deck data found');
			}
		} catch (err) {
			console.error('Preview error:', err);
			error = err instanceof Error ? err.message : 'Failed to load deck preview';
			toasts.error('Failed to load deck preview');
		} finally {
			loading = false;
		}

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

		importing = true;
		try {
			if (conflict) {
				// Has conflicts - show merge tool
				showMergeTool = true;
				importedDeck = previewDeck;
				toasts.info(
					`⚠️ Deck "${previewDeck.meta.title}" has local changes. Please resolve conflicts.`
				);
			} else {
				// No conflicts - import directly
				await nextDeckStore.importDeck(previewDeck);

				// Switch from preview to success screen
				previewing = false;
				imported = true;

				// Clear the URL hash after successful import
				replaceState(window.location.pathname, {});

				toasts.success(`🎉 Deck "${previewDeck.meta.title}" imported to your library!`);
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
		if (!conflict || !importedDeck) return;

		try {
			// Apply the merge resolution to create the final deck
			const mergedDeck = applyMergeResolution(resolution);

			// Save the merged deck (will overwrite existing)
			await nextDb.upsertDeck(mergedDeck);

			// Load it into the store
			await nextDeckStore.loadDeck(mergedDeck.id);

			// Update state
			showMergeTool = false;
			imported = true;
			conflict = null;

			toasts.success(`🔀 Deck "${mergedDeck.meta.title}" merged successfully!`);
		} catch (err) {
			console.error('Merge error:', err);
			error = err instanceof Error ? err.message : 'Failed to merge deck';
			toasts.error('Failed to merge deck');
		}
	}

	// Handle merge cancellation
	function handleMergeCancel() {
		showMergeTool = false;
		conflict = null;
		importedDeck = null;

		// Go back to the app
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
</script>

<div class="import-page">
	{#if showMergeTool && conflict}
		<!-- Full-screen merge tool -->
		<div class="merge-container">
			<MergeTool {conflict} onResolve={handleMergeResolve} onCancel={handleMergeCancel} />
		</div>
	{:else if previewing && previewDeck}
		<!-- Preview mode with deck viewer -->
		<MainHeader title={previewDeck.meta.title}>
			{#snippet metadata()}
				<DeckMetadata
					cardCount={previewDeck.cards.length}
					imageCount={countImages(previewDeck)}
					published={true}
					cardBacksVisible={showCardBacks}
					onCardBacksChange={handleCardBacksChange}
				/>
			{/snippet}

			{#snippet actions()}
				<div class="preview-actions">
					<!-- Layout selector -->
					<div class="layout-selector">
						<label for="layout-select">Print Size:</label>
						<select
							id="layout-select"
							bind:value={layout}
							onchange={() => handleLayoutChange(layout)}
						>
							<option value="poker">Poker</option>
							<option value="tarot">Tarot</option>
						</select>
					</div>

					<button class="action-button primary" onclick={handleImport} disabled={importing}>
						{#if importing}
							<div class="button-spinner"></div>
							Adding...
						{:else}
							<Copy size={16} />
							<span>Add to Collection</span>
						{/if}
					</button>

					<button class="action-button" onclick={handleDownloadJson}>
						<Download size={16} />
						<span>Download JSON</span>
					</button>

					<button class="action-button secondary" onclick={() => goto('/')}>
						<span>Cancel</span>
					</button>
				</div>
			{/snippet}
		</MainHeader>

		<!-- Deck viewer - switches to print layout when printing -->
		<div class="preview-content">
			{#if isPrintMode}
				<PrintLayout cards={previewDeck.cards} {layout} {showCardBacks} />
			{:else}
				<DeckPreview deck={previewDeck} />
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

	.merge-container {
		width: 100vw;
		min-height: 100vh;
		padding: 2rem;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		background: var(--ui-bg, #ffffff);
		overflow-y: auto;
	}

	/* Preview content */
	.preview-content {
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: 0 2rem 2rem;
	}

	.preview-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.layout-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--ui-hover-bg, #f8fafc);
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
	}

	.layout-selector label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--ui-text, #1a202c);
		white-space: nowrap;
	}

	.layout-selector select {
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		background: white;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.layout-selector select:hover {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.action-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 6px;
		background: var(--brand);
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.action-button:hover:not(:disabled) {
		background: #a80116;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.action-button.primary {
		background: var(--brand);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.action-button.secondary {
		background: var(--ui-hover-bg, #f8fafc);
		color: var(--ui-text, #1a202c);
		border: 1px solid var(--ui-border, #e2e8f0);
	}

	.action-button.secondary:hover {
		background: var(--ui-border, #e2e8f0);
	}

	.action-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.button-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.merge-container {
			padding: 1rem;
		}

		.preview-content {
			padding: 0 1rem 1rem;
		}

		.preview-actions {
			width: 100%;
		}

		.action-button {
			flex: 1;
		}
	}

	@media print {
		.preview-content {
			padding: 0;
		}
	}
</style>
