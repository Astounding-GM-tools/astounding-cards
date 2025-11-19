<script lang="ts">
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import { authStore } from '$lib/next/stores/auth';
	import { toasts } from '$lib/stores/toast';
	import { goto } from '$app/navigation';
	import { Plus, FolderOpen } from 'lucide-svelte';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte';

	async function handleCreateNewDeck() {
		const newDeck = await nextDeckStore.createNewDeck();
		if (newDeck) {
			toasts.success('✨ New deck created!');
			goto(`/${newDeck.id}`);
		}
	}

	function handleBrowseGallery() {
		goto('/gallery');
	}
</script>

<MainHeader title="My Decks" hideGalleryLink={false}>
	{#snippet actions()}
		<div class="dashboard-actions">
			<button class="action-button primary" onclick={handleCreateNewDeck}>
				<Plus size={16} />
				<span>New Deck</span>
			</button>

			<button class="action-button" onclick={handleBrowseGallery}>
				<FolderOpen size={16} />
				<span>Browse Gallery</span>
			</button>
		</div>
	{/snippet}
</MainHeader>

<section class="dashboard">
	<div class="dashboard-intro">
		<h2>Welcome to Your Dashboard</h2>
		<p>Create custom card decks for tabletop RPGs, board games, or any creative project.</p>
	</div>

	<div class="quick-actions">
		<button class="quick-action-card" onclick={handleCreateNewDeck}>
			<div class="icon-large">📇</div>
			<h3>Create New Deck</h3>
			<p>Start from scratch with a blank deck</p>
		</button>

		<button class="quick-action-card" onclick={handleBrowseGallery}>
			<div class="icon-large">🌍</div>
			<h3>Browse Gallery</h3>
			<p>Explore decks created by the community</p>
		</button>

		<a href="/" class="quick-action-card">
			<div class="icon-large">✏️</div>
			<h3>Continue Editing</h3>
			<p>Resume working on your current deck</p>
		</a>
	</div>
</section>

<style>
	.dashboard {
		max-width: var(--page-max-width);
		padding: 2rem;
		margin: 0 auto;
	}

	.dashboard-intro {
		text-align: center;
		margin-bottom: 3rem;
	}

	.dashboard-intro h2 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--ui-text, #1a202c);
	}

	.dashboard-intro p {
		margin: 0;
		font-size: 1.125rem;
		color: var(--ui-muted, #64748b);
	}

	.quick-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		max-width: 900px;
		margin: 0 auto;
	}

	.quick-action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		background: white;
		border: 2px solid var(--ui-border, #e2e8f0);
		border-radius: 12px;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.quick-action-card:hover {
		border-color: var(--brand);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.icon-large {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.quick-action-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
	}

	.quick-action-card p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
		text-align: center;
	}

	.dashboard-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
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

	.action-button:hover {
		background: #a80116;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.action-button.primary {
		background: var(--brand);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
</style>
