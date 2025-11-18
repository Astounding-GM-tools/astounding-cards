<script lang="ts">
	import MainHeader from './MainHeader.svelte';
	import DeckMetadata from './DeckMetadata.svelte';
	import { Copy, Download, Heart } from 'lucide-svelte';

	let liked = $state(false);

	function handleCloneDeck() {
		alert('Clone this deck to your account');
	}

	function handleDownload() {
		alert('Download deck as JSON');
	}

	function handleToggleLike() {
		liked = !liked;
	}
</script>

<MainHeader
	title="Fantasy Heroes Deck"
	mockIsAuthenticated={true}
	mockUserEmail="user@example.com"
	mockDeckCount={5}
	mockTokenBalance={800}
>
	{#snippet metadata()}
		<DeckMetadata
			cardCount={24}
			imageCount={18}
			published={true}
			genre="Fantasy RPG"
			shareCount={142}
		/>
	{/snippet}

	{#snippet actions()}
		<div class="preview-actions">
			<button class="action-button" onclick={handleCloneDeck}>
				<Copy size={16} />
				<span>Clone to My Decks</span>
			</button>

			<button class="action-button" onclick={handleDownload}>
				<Download size={16} />
				<span>Download JSON</span>
			</button>

			<button
				class="action-button like-button"
				class:liked
				onclick={handleToggleLike}
			>
				<Heart size={16} fill={liked ? 'currentColor' : 'none'} />
				<span>{liked ? 'Liked' : 'Like'}</span>
			</button>
		</div>
	{/snippet}
</MainHeader>

<style>
	.preview-actions {
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

	.like-button.liked {
		background: #dc2626;
	}

	.like-button.liked:hover {
		background: #b91c1c;
	}
</style>
