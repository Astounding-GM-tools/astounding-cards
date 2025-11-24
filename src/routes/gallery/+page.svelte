<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { nextDb } from '$lib/next/stores/database.js';
	import { generateId } from '$lib/next/utils/idUtils.js';
	import { deckToCard } from '$lib/next/utils/deckToCard.js';
	import type { Deck } from '$lib/next/types/deck.js';
	import type { Card } from '$lib/next/types/card.js';
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import DeckPreview from '$lib/next/components/preview/DeckPreview.svelte';
	import { Search, Heart } from 'lucide-svelte';

	// State
	let decks = $state<any[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let selectedTags = $state<string[]>([]);
	let sortBy = $state<'recent' | 'popular' | 'imported'>('recent');
	let hasMore = $state(false);
	let offset = $state(0);
	const limit = 20;

	// Common tags from loaded decks
	let commonTags = $state<string[]>([]);

	// Transform decks into a "meta-deck" - a deck where each card represents a deck!
	let metaDeck = $derived<Deck>({
		id: 'gallery',
		meta: {
			title: 'Gallery',
			theme: 'classic',
			imageStyle: 'classic',
			layout: 'poker',
			lastEdited: Date.now(),
			createdAt: Date.now()
		},
		cards: decks.map((deck) => deckToCard(deck))
	});

	// Load decks
	async function loadDecks(append = false) {
		if (!append) {
			isLoading = true;
			offset = 0;
		}

		try {
			const params = new URLSearchParams({
				limit: limit.toString(),
				offset: offset.toString(),
				sort: sortBy
			});

			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}

			if (selectedTags.length > 0) {
				params.set('tags', selectedTags.join(','));
			}

			const response = await fetch(`/api/decks/gallery?${params}`);

			if (!response.ok) {
				throw new Error('Failed to load decks');
			}

			const result = await response.json();

			if (append) {
				decks = [...decks, ...result.decks];
			} else {
				decks = result.decks;
				// Extract unique tags from loaded decks
				const allTags = new Set<string>();
				for (const deck of result.decks) {
					for (const tag of deck.tags || []) {
						allTags.add(tag);
					}
				}
				commonTags = Array.from(allTags).sort();
			}

			hasMore = result.pagination.hasMore;
			error = null;
		} catch (err) {
			console.error('Failed to load gallery:', err);
			error = err instanceof Error ? err.message : 'Failed to load gallery';
		} finally {
			isLoading = false;
		}
	}

	// Load more (pagination)
	function loadMore() {
		offset += limit;
		loadDecks(true);
	}

	// Apply filters
	function applyFilters() {
		offset = 0;
		loadDecks();
	}

	// Clear filters
	function clearFilters() {
		searchQuery = '';
		selectedTags = [];
		sortBy = 'recent';
		loadDecks();
	}

	// Toggle tag selection
	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
		applyFilters();
	}

	// Handle deck preview (when deck-card is clicked)
	function handlePreviewDeck(deckId: string) {
		// Find the deck by ID
		const deck = decks.find((d) => d.id === deckId);
		if (deck) {
			// Navigate to the deck's slug
			goto(`/${deck.slug}`);
		}
	}

	// Import deck
	async function importDeck(deck: any) {
		try {
			// Check if we already have this deck locally
			const existingLocal = await nextDb.getDeck(deck.id);
			if (existingLocal) {
				// Already have it - just load and navigate
				await nextDeckStore.loadDeck(existingLocal.id);
				toasts.info(`Deck "${existingLocal.meta.title}" is already in your library`);
				goto('/');
				return;
			}

			// Fetch full deck details with cards
			const response = await fetch(`/api/deck/${deck.id}`);
			if (!response.ok) {
				throw new Error('Failed to fetch deck details');
			}

			const result = await response.json();
			const fullDeck = result.deck;

			// Create new local deck with imported data (keeping original title and ID)
			const now = Date.now();

			// Create complete deck object
			const newDeck: Deck = {
				id: fullDeck.id, // Keep original ID
				meta: {
					title: fullDeck.title, // Keep original title
					theme: fullDeck.theme,
					imageStyle: fullDeck.imageStyle || 'classic',
					layout: fullDeck.layout || 'tarot',
					lastEdited: now,
					createdAt: now,
					creator_id: deck.user_id, // Capture creator
					creator_name: deck.creator_name || 'Unknown'
				},
				cards: fullDeck.cards
			};

			// Save to database
			await nextDb.upsertDeck(newDeck);

			// Load the new deck in the store
			await nextDeckStore.loadDeck(newDeck.id);

			// Increment import count (fire and forget)
			fetch(`/api/decks/${deck.id}/import`, { method: 'POST' }).catch(() => {});

			toasts.success(`✅ Deck "${fullDeck.title}" imported to your library!`);
			goto('/');
		} catch (err) {
			console.error('Import error:', err);
			toasts.error(err instanceof Error ? err.message : 'Failed to import deck');
		}
	}

	// Initialize
	onMount(() => {
		loadDecks();
	});

	// Reactive: reload when filters change
	$effect(() => {
		// Trigger reload when sort changes
		if (sortBy) {
			applyFilters();
		}
	});
</script>

<svelte:head>
	<title>Deck Gallery - Astounding Cards</title>
</svelte:head>

<MainHeader title="Gallery" hideGalleryLink={true}>
	{#snippet actions()}
		<div class="gallery-actions">
			<div class="search-box">
				<Search size={16} />
				<input
					type="text"
					placeholder="Search decks..."
					bind:value={searchQuery}
					class="search-input-inline"
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
			</div>

			<select bind:value={sortBy} class="sort-select-inline">
				<option value="recent">Most Recent</option>
				<option value="popular">Most Popular</option>
				<option value="imported">Most Imported</option>
			</select>
		</div>
	{/snippet}
</MainHeader>

<!-- Tags filter row -->
{#if commonTags.length > 0}
	<div class="tags-filter-row">
		<div class="tags-container">
			{#each commonTags as tag}
				<button
					class="tag-chip"
					class:active={selectedTags.includes(tag)}
					onclick={() => toggleTag(tag)}
				>
					{tag}
				</button>
			{/each}
			{#if selectedTags.length > 0}
				<button class="clear-tags-button" onclick={clearFilters}> Clear All </button>
			{/if}
		</div>
	</div>
{/if}

<div class="gallery-page">
	{#if isLoading && decks.length === 0}
		<div class="loading-state">
			<div class="loading-spinner">⏳</div>
			<p>Loading decks...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>❌ {error}</p>
			<button class="retry-button" onclick={() => loadDecks()}>Retry</button>
		</div>
	{:else if decks.length === 0}
		<div class="empty-state">
			<h2>📭 No Decks Found</h2>
			<p>Try adjusting your filters or be the first to publish a deck!</p>
		</div>
	{:else}
		<!-- Deck of decks! Each card represents a deck -->
		<div class="gallery-content">
			<DeckPreview deck={metaDeck} onEdit={handlePreviewDeck} mode="deck" />
		</div>

		{#if hasMore}
			<div class="load-more-section">
				<button class="load-more-button" onclick={loadMore} disabled={isLoading}>
					{isLoading ? 'Loading...' : 'Load More'}
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.gallery-page {
		min-height: 100vh;
		background: white;
		color: var(--ui-text, #1a202c);
	}

	/* Gallery Actions (in header) - styled like ActionButtons */
	.gallery-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
		width: 100%;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		flex: 1;
		min-width: 200px;
		transition: all 0.2s ease;
	}

	.search-box:focus-within {
		border-color: var(--button-primary-bg, #3b82f6);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.search-box :global(svg) {
		flex-shrink: 0;
		color: var(--ui-text-secondary, #64748b);
	}

	.search-input-inline {
		border: none;
		outline: none;
		background: none;
		font-size: 0.875rem;
		font-weight: 500;
		flex: 1;
		color: var(--ui-text, #1a202c);
		font-family: inherit;
	}

	.search-input-inline::placeholder {
		color: var(--ui-text-secondary, #64748b);
		font-weight: 400;
	}

	.sort-select-inline {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: white;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.sort-select-inline:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* Tags Filter Row */
	.tags-filter-row {
		background: var(--ui-hover-bg, #f8fafc);
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		padding: 1rem 2rem;
	}

	.tags-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		max-width: var(--page-max-width);
		margin: 0 auto;
		align-items: center;
	}

	.tag-chip {
		padding: 0.375rem 0.875rem;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 20px;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.tag-chip:hover {
		border-color: var(--ui-text, #1a202c);
		background: var(--ui-hover-bg, #f8fafc);
	}

	.tag-chip.active {
		background: var(--ui-text, #1a202c);
		color: white;
		border-color: var(--ui-text, #1a202c);
	}

	.clear-tags-button {
		padding: 0.375rem 0.875rem;
		background: var(--ui-border, #e2e8f0);
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 20px;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	.clear-tags-button:hover {
		background: var(--ui-text, #1a202c);
		color: white;
	}

	/* Gallery Content */
	.gallery-content {
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: 2rem;
	}

	/* Loading/Error/Empty States */
	.loading-state,
	.error-state,
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
	}

	.loading-spinner {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.retry-button {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: var(--ui-text, #1a202c);
		border: none;
		border-radius: 6px;
		color: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.retry-button:hover {
		background: var(--ui-muted, #64748b);
	}

	/* Load More */
	.load-more-section {
		text-align: center;
		padding: 2rem;
	}

	.load-more-button {
		padding: 0.75rem 2rem;
		background: white;
		border: 2px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
		color: var(--ui-text, #1a202c);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.load-more-button:hover:not(:disabled) {
		border-color: var(--ui-text, #1a202c);
		background: var(--ui-hover-bg, #f8fafc);
	}

	.load-more-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.gallery-content {
			padding: 1rem;
		}

		.tags-filter-row {
			padding: 0.75rem 1rem;
		}
	}
</style>
