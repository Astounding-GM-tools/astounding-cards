<script lang="ts">
	import { Plus, Check } from 'lucide-svelte';

	interface Deck {
		id: string;
		title: string;
		cardCount: number;
	}

	interface Props {
		decks: Deck[];
		currentDeckId?: string;
		onSelectDeck: (deckId: string) => void;
		onNewDeck: () => void;
	}

	let { decks, currentDeckId, onSelectDeck, onNewDeck }: Props = $props();
</script>

<div class="deck-switcher">
	{#if decks.length === 0}
		<div class="empty-state">
			<p class="empty-message">No decks yet</p>
			<button class="new-deck-button primary" onclick={onNewDeck}>
				<Plus size={16} />
				<span>Create Your First Deck</span>
			</button>
		</div>
	{:else}
		<!-- Deck List -->
		<div class="deck-list">
			{#each decks as deck}
				<button
					class="deck-item"
					class:active={deck.id === currentDeckId}
					onclick={() => onSelectDeck(deck.id)}
				>
					<div class="deck-item-content">
						<span class="deck-item-title">{deck.title}</span>
						<span class="deck-item-count">{deck.cardCount} cards</span>
					</div>
					{#if deck.id === currentDeckId}
						<Check size={16} class="check-icon" />
					{/if}
				</button>
			{/each}
		</div>

		<!-- New Deck Button -->
		<div class="deck-list-footer">
			<button class="new-deck-button" onclick={onNewDeck}>
				<Plus size={16} />
				<span>New Deck</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.deck-switcher {
		min-width: 250px;
		max-width: 350px;
	}

	/* Empty State */
	.empty-state {
		padding: 1.5rem 1rem;
		text-align: center;
	}

	.empty-message {
		margin: 0 0 1rem 0;
		color: var(--ui-muted, #64748b);
		font-size: 0.875rem;
	}

	/* Deck List */
	.deck-list {
		max-height: 400px;
		overflow-y: auto;
	}

	.deck-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		background: none;
		text-align: left;
		cursor: pointer;
		transition: background 0.2s;
	}

	.deck-item:hover {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.deck-item.active {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.deck-item-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}

	.deck-item-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--ui-text, #1a202c);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.deck-item-count {
		font-size: 0.75rem;
		color: var(--ui-muted, #64748b);
	}

	.deck-item.active .deck-item-title {
		color: var(--button-primary-bg, #3b82f6);
	}

	:global(.check-icon) {
		color: var(--button-primary-bg, #3b82f6);
		flex-shrink: 0;
	}

	/* Footer */
	.deck-list-footer {
		border-top: 1px solid var(--ui-border, #e2e8f0);
		padding: 0.5rem;
	}

	.new-deck-button {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.new-deck-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.new-deck-button.primary {
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.new-deck-button.primary:hover {
		background: var(--button-primary-hover-bg, #2563eb);
		border-color: var(--button-primary-hover-bg, #2563eb);
	}

	/* Scrollbar */
	.deck-list::-webkit-scrollbar {
		width: 6px;
	}

	.deck-list::-webkit-scrollbar-track {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.deck-list::-webkit-scrollbar-thumb {
		background: var(--ui-border, #e2e8f0);
		border-radius: 3px;
	}

	.deck-list::-webkit-scrollbar-thumb:hover {
		background: var(--ui-muted, #64748b);
	}
</style>
