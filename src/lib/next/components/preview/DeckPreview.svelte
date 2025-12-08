<script lang="ts">
	import type { Deck } from '../../types/deck.js';

	import Card from '../card/Card.svelte';
	import CardBackContent from '../card/CardBackContent.svelte';
	import CardFrontContent from '../card/CardFrontContent.svelte';

	import { Pencil, ArrowRight, CreditCard, FileText } from 'lucide-svelte';

	interface Props {
		deck: Deck;
		onEdit?: (cardId: string) => void;
		mode?: 'card' | 'deck'; // card = editing cards, deck = viewing deck previews in gallery
	}

	let { deck, onEdit, mode = 'card' }: Props = $props();
	let showingBack = $state(new Set<string>());

	// Determine button labels and icons based on mode
	let backButtonLabel = $derived(mode === 'deck' ? 'Details' : 'Back');
	let editButtonIcon = $derived(mode === 'deck' ? ArrowRight : Pencil);
	let editButtonTitle = $derived(mode === 'deck' ? 'View deck' : 'Edit card');

	function toggleCardSide(cardId: string) {
		if (showingBack.has(cardId)) {
			showingBack.delete(cardId);
		} else {
			showingBack.add(cardId);
		}
		showingBack = new Set(showingBack); // Trigger reactivity
	}

	function isShowingBack(cardId: string): boolean {
		return showingBack.has(cardId);
	}
</script>

<div class="deck-preview">
	<div class="cards-grid">
		{#each deck.cards as card (card.id)}
			<div class="card-wrapper">
				<div class="card-display">
					<Card preview={true}>
						{#if isShowingBack(card.id)}
							<CardBackContent {card} />
						{:else}
							<CardFrontContent {card} />
						{/if}
					</Card>
				</div>
				<div class="card-controls">
					<button
						class="control-button"
						class:active={!isShowingBack(card.id)}
						onclick={() => toggleCardSide(card.id)}
						ontouchend={(e) => {
							e.preventDefault();
							toggleCardSide(card.id);
						}}
					>
						<div class="button-icon">
							<CreditCard size={16} />
						</div>
						<span class="button-text">Front</span>
					</button>
					<button
						class="control-button"
						class:active={isShowingBack(card.id)}
						onclick={() => toggleCardSide(card.id)}
						ontouchend={(e) => {
							e.preventDefault();
							toggleCardSide(card.id);
						}}
					>
						<div class="button-icon">
							<FileText size={16} />
						</div>
						<span class="button-text">{backButtonLabel}</span>
					</button>
					{#if onEdit}
						<button
							class="control-button action"
							onclick={() => onEdit(card.id)}
							ontouchend={(e) => {
								// Manually trigger the action on touchend for reliable mobile behavior
								e.preventDefault(); // Prevent the delayed click
								e.stopPropagation(); // Prevent event bubbling
								onEdit(card.id);
							}}
							title={editButtonTitle}
						>
							<div class="button-icon">
								{@render editButtonIcon({ size: 16 })}
							</div>
							<span class="button-text">{mode === 'deck' ? 'Open' : 'Edit'}</span>
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.deck-preview {
		width: 100%;
		container-type: inline-size;
		container-name: deck-preview;
	}

	.cards-grid {
		display: grid;
		/* Use container queries instead of viewport for more reliable responsive behavior */
		grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
		gap: 2rem;
		padding: 1rem 0;
	}

	/* Use both viewport and container-based approach */
	@media (max-width: 640px) {
		.cards-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}

	/* Additional protection: if grid would overflow, force single column */
	@container (max-width: 400px) {
		.cards-grid {
			grid-template-columns: 1fr !important;
			gap: 1.5rem;
		}
	}

	.card-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 100%;
		min-width: 0;
	}

	.card-display {
		width: 100%;
		height: auto;
		aspect-ratio: 5/7;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		/* Prevent touch zoom on cards */
		touch-action: manipulation;
		-webkit-user-select: none;
		user-select: none;
	}

	/* Only apply hover effects on devices with hover capability (not touch) */
	@media (hover: hover) and (pointer: fine) {
		.card-display:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}
	}

	.card-controls {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.control-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.875rem;
		background: white;
		color: var(--ui-text, #1a202c);
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		flex: 1;
		min-width: 0;
	}

	/* Only add transitions and hover on non-touch devices */
	@media (hover: hover) and (pointer: fine) {
		.control-button {
			transition: all 0.2s ease;
		}

		.control-button:hover {
			background: var(--ui-hover-bg, #f8fafc);
			border-color: var(--button-primary-bg, #3b82f6);
			transform: translateY(-1px);
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}
	}

	.control-button.active {
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.control-button.action {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border: none;
		flex: 0 0 auto;
	}

	/* Hover states only on non-touch devices */
	@media (hover: hover) and (pointer: fine) {
		.control-button.active:hover {
			background: var(--button-primary-hover-bg, #2563eb);
			border-color: var(--button-primary-hover-bg, #2563eb);
			box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
		}

		.control-button.action:hover {
			background: linear-gradient(135deg, #059669 0%, #047857 100%);
			box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
		}
	}

	.button-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: inherit;
	}

	.button-text {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Hide text on very small cards */
	@media (max-width: 640px) {
		.control-button {
			padding: 0.5rem;
		}

		.button-text {
			display: none;
		}

		.control-button.action {
			padding: 0.5rem 0.75rem;
		}

		.control-button.action .button-text {
			display: inline;
		}
	}
</style>
