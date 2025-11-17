<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';

	// State
	let decks = $state<any[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let selectedTheme = $state<string>('');
	let selectedTags = $state<string[]>([]);
	let sortBy = $state<'recent' | 'popular' | 'imported'>('recent');
	let hasMore = $state(false);
	let offset = $state(0);
	const limit = 20;

	// Available themes and common tags
	const themes = ['classic', 'modern', 'inked', 'cyberpunk', 'fantasy'];
	const commonTags = $state<string[]>([]);

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

			if (selectedTheme) {
				params.set('theme', selectedTheme);
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
		selectedTheme = '';
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

	// Import deck
	async function importDeck(deck: any) {
		try {
			// Fetch full deck details with cards
			const response = await fetch(`/api/deck/${deck.id}`);
			if (!response.ok) {
				throw new Error('Failed to fetch deck details');
			}

			const result = await response.json();
			const fullDeck = result.deck;

			// Create new local deck with imported data
			const importedTitle = `${fullDeck.title} (Imported)`;
			const success = await nextDeckStore.createDeck(importedTitle, {
				theme: fullDeck.theme,
				cards: fullDeck.cards
			});

			if (success) {
				// Increment import count
				await fetch(`/api/decks/${deck.id}/import`, {
					method: 'POST'
				});

				toasts.success(`✅ Deck imported! Now editing "${importedTitle}"`);
				goto('/next');
			} else {
				throw new Error('Failed to create deck');
			}
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

<div class="gallery-page">
	<div class="gallery-header">
		<div class="header-content">
			<h1>🌍 Deck Gallery</h1>
			<p class="subtitle">Discover and import amazing decks created by the community</p>
		</div>
	</div>

	<div class="gallery-container">
		<!-- Sidebar Filters -->
		<aside class="filters-sidebar">
			<div class="filter-section">
				<h3>Search</h3>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search decks..."
					class="search-input"
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
				<button class="filter-apply-button" onclick={applyFilters}>Search</button>
			</div>

			<div class="filter-section">
				<h3>Sort By</h3>
				<select bind:value={sortBy} class="sort-select">
					<option value="recent">Most Recent</option>
					<option value="popular">Most Viewed</option>
					<option value="imported">Most Imported</option>
				</select>
			</div>

			<div class="filter-section">
				<h3>Theme</h3>
				<select bind:value={selectedTheme} onchange={applyFilters} class="theme-select">
					<option value="">All Themes</option>
					{#each themes as theme}
						<option value={theme}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</option>
					{/each}
				</select>
			</div>

			{#if commonTags.length > 0}
				<div class="filter-section">
					<h3>Tags</h3>
					<div class="tags-filter">
						{#each commonTags as tag}
							<button
								class="tag-filter-button"
								class:active={selectedTags.includes(tag)}
								onclick={() => toggleTag(tag)}
							>
								{tag}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if searchQuery || selectedTheme || selectedTags.length > 0}
				<button class="clear-filters-button" onclick={clearFilters}>Clear All Filters</button>
			{/if}
		</aside>

		<!-- Main Content -->
		<main class="gallery-main">
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
				<div class="deck-grid">
					{#each decks as deck (deck.id)}
						<div class="deck-card">
							<div class="deck-card-header">
								<h3 class="deck-card-title">{deck.title}</h3>
								<div class="deck-badges">
									{#if deck.is_featured}
										<span class="badge featured">⭐ Featured</span>
									{/if}
									{#if deck.is_curated}
										<span class="badge curated">✓ Curated</span>
									{/if}
								</div>
							</div>

							{#if deck.description}
								<p class="deck-card-description">{deck.description}</p>
							{/if}

							<div class="deck-card-meta">
								<span class="meta-item">🎴 {deck.cardCount} cards</span>
								<span class="meta-item theme-badge">{deck.theme}</span>
							</div>

							{#if deck.tags && deck.tags.length > 0}
								<div class="deck-card-tags">
									{#each deck.tags.slice(0, 3) as tag}
										<span class="tag">{tag}</span>
									{/each}
								</div>
							{/if}

							<div class="deck-card-stats">
								<span>👁️ {deck.view_count || 0}</span>
								<span>📥 {deck.import_count || 0}</span>
							</div>

							<div class="deck-card-actions">
								<button class="import-button" onclick={() => importDeck(deck)}>
									📥 Import Deck
								</button>
							</div>
						</div>
					{/each}
				</div>

				{#if hasMore}
					<div class="load-more-section">
						<button class="load-more-button" onclick={loadMore} disabled={isLoading}>
							{isLoading ? 'Loading...' : 'Load More'}
						</button>
					</div>
				{/if}
			{/if}
		</main>
	</div>
</div>

<style>
	.gallery-page {
		min-height: 100vh;
		background: var(--bg-primary, #0f172a);
		color: var(--text-primary, #f1f5f9);
	}

	.gallery-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 3rem 2rem;
		text-align: center;
	}

	.header-content h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		font-weight: 700;
	}

	.subtitle {
		margin: 0;
		font-size: 1.125rem;
		opacity: 0.9;
	}

	.gallery-container {
		display: grid;
		grid-template-columns: 250px 1fr;
		gap: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.filters-sidebar {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.filter-section {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 1rem;
	}

	.filter-section h3 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.7;
	}

	.search-input,
	.sort-select,
	.theme-select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.search-input:focus,
	.sort-select:focus,
	.theme-select:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.4);
	}

	.filter-apply-button {
		width: 100%;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: inherit;
		cursor: pointer;
		transition: background 0.2s;
	}

	.filter-apply-button:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.tags-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-filter-button {
		padding: 0.25rem 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		color: inherit;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tag-filter-button:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.tag-filter-button.active {
		background: rgba(100, 200, 255, 0.3);
		border-color: #64c8ff;
		color: #64c8ff;
	}

	.clear-filters-button {
		width: 100%;
		padding: 0.75rem;
		background: rgba(220, 38, 38, 0.2);
		border: 1px solid rgba(220, 38, 38, 0.4);
		border-radius: 6px;
		color: #fca5a5;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	.clear-filters-button:hover {
		background: rgba(220, 38, 38, 0.3);
	}

	.gallery-main {
		min-height: 500px;
	}

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
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: inherit;
		cursor: pointer;
	}

	.deck-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.deck-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all 0.2s;
	}

	.deck-card:hover {
		transform: translateY(-2px);
		border-color: rgba(255, 255, 255, 0.3);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.deck-card-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 0.5rem;
	}

	.deck-card-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		flex: 1;
	}

	.deck-badges {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.badge {
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.badge.featured {
		background: rgba(251, 191, 36, 0.2);
		color: #fbbf24;
	}

	.badge.curated {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.deck-card-description {
		margin: 0;
		font-size: 0.875rem;
		opacity: 0.8;
		line-height: 1.5;
	}

	.deck-card-meta {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		font-size: 0.875rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.theme-badge {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.deck-card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		padding: 0.25rem 0.75rem;
		background: rgba(100, 200, 255, 0.2);
		color: #64c8ff;
		border-radius: 16px;
		font-size: 0.75rem;
	}

	.deck-card-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		opacity: 0.7;
	}

	.deck-card-actions {
		margin-top: auto;
	}

	.import-button {
		width: 100%;
		padding: 0.75rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		border-radius: 8px;
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.import-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.load-more-section {
		text-align: center;
		padding: 2rem 0;
	}

	.load-more-button {
		padding: 0.75rem 2rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: inherit;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.load-more-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.load-more-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.gallery-container {
			grid-template-columns: 1fr;
		}

		.deck-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
