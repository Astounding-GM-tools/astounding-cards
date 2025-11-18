<script lang="ts">
	import MainHeader from './MainHeader.svelte';
	import { Search, Filter, TrendingUp } from 'lucide-svelte';

	let searchQuery = $state('');
	let sortBy = $state('popular');
</script>

<MainHeader title="Gallery" hideGalleryLink={true} mockIsAuthenticated={false} mockDeckCount={0}>
	{#snippet actions()}
		<div class="gallery-actions">
			<div class="search-box">
				<Search size={16} />
				<input
					type="text"
					placeholder="Search decks..."
					bind:value={searchQuery}
					class="search-input"
				/>
			</div>

			<button class="filter-button">
				<Filter size={16} />
				<span>Filters</span>
			</button>

			<button class="sort-button">
				<TrendingUp size={16} />
				<span>Popular</span>
			</button>
		</div>
	{/snippet}
</MainHeader>

<style>
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
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		flex: 1;
		min-width: 200px;
	}

	.search-input {
		border: none;
		outline: none;
		background: none;
		font-size: 0.875rem;
		flex: 1;
		color: var(--ui-text, #1a202c);
	}

	.search-input::placeholder {
		color: var(--ui-muted, #64748b);
	}

	.filter-button,
	.sort-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: white;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.filter-button:hover,
	.sort-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--brand);
	}
</style>
