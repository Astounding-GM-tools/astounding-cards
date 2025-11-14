<script lang="ts">
	import type { Card as CardType } from '../../types/card.js';
	import type { Layout } from '../../types/deck.js';
	import Card from '../card/Card.svelte';
	import CardFrontContent from '../card/CardFrontContent.svelte';
	import CardBackContent from '../card/CardBackContent.svelte';
	import { onMount } from 'svelte';

	interface Props {
		cards: CardType[];
		layout: Layout;
		showCardBacks?: boolean;
	}

	let { cards, layout, showCardBacks = true }: Props = $props();

	// Track which cards are showing back side (for mobile swipe)
	let showingBack = $state(new Set<string>());

	// Touch/swipe handling
	let touchStartX = 0;
	let touchStartY = 0;
	let isTouch = false;

	function handleTouchStart(event: TouchEvent, cardId: string) {
		if (event.touches.length === 1) {
			touchStartX = event.touches[0].clientX;
			touchStartY = event.touches[0].clientY;
			isTouch = true;
		}
	}

	function handleTouchEnd(event: TouchEvent, cardId: string) {
		if (!isTouch || event.changedTouches.length !== 1) return;

		const touchEndX = event.changedTouches[0].clientX;
		const touchEndY = event.changedTouches[0].clientY;

		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;

		// Only consider horizontal swipes (ignore vertical scrolling)
		if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
			event.preventDefault();

			if (deltaX > 0) {
				// Swipe right -> show front
				showingBack.delete(cardId);
			} else {
				// Swipe left -> show back (if backs are enabled)
				if (showCardBacks) {
					showingBack.add(cardId);
				}
			}
			showingBack = new Set(showingBack); // Trigger reactivity
		}

		isTouch = false;
	}

	function isShowingBack(cardId: string): boolean {
		return showingBack.has(cardId);
	}

	function toggleCardSide(cardId: string) {
		if (!showCardBacks) return;

		if (showingBack.has(cardId)) {
			showingBack.delete(cardId);
		} else {
			showingBack.add(cardId);
		}
		showingBack = new Set(showingBack); // Trigger reactivity
	}
</script>

<div class="mobile-card-list">
	{#if cards.length > 0}
		{#each cards as card (card.id)}
			<div
				class="card-pair"
				class:mobile={true}
				ontouchstart={(e) => handleTouchStart(e, card.id)}
				ontouchend={(e) => handleTouchEnd(e, card.id)}
			>
				<!-- Desktop: Side-by-side front and back -->
				<div class="desktop-pair">
					<!-- Front card -->
					<div class="card-container front">
						<Card cardId={card.id}>
							<CardFrontContent {card} />
						</Card>
						<div class="card-label">Front</div>
					</div>

					<!-- Back card (if enabled) -->
					{#if showCardBacks}
						<div class="card-container back">
							<Card cardId={card.id}>
								<CardBackContent {card} />
							</Card>
							<div class="card-label">Back</div>
						</div>
					{/if}
				</div>

				<!-- Mobile: Single card with swipe to toggle -->
				<div class="mobile-single">
					<Card cardId={card.id}>
						{#if isShowingBack(card.id) && showCardBacks}
							<CardBackContent {card} />
						{:else}
							<CardFrontContent {card} />
						{/if}
					</Card>

					<!-- Mobile controls -->
					{#if showCardBacks}
						<div class="mobile-controls">
							<button
								class="side-toggle"
								class:active={!isShowingBack(card.id)}
								onclick={() => toggleCardSide(card.id)}
							>
								Front
							</button>
							<button
								class="side-toggle"
								class:active={isShowingBack(card.id)}
								onclick={() => toggleCardSide(card.id)}
							>
								Back
							</button>
						</div>
						<div class="swipe-hint">← Swipe to toggle →</div>
					{/if}
				</div>
			</div>
		{/each}
	{:else}
		<div class="empty-state">
			<p>No cards to display</p>
		</div>
	{/if}
</div>

<style>
	.mobile-card-list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 1rem;
		max-width: 100%;
	}

	.card-pair {
		position: relative;
	}

	/* Desktop layout: side-by-side cards */
	.desktop-pair {
		display: none;
		gap: 2rem;
		align-items: flex-start;
	}

	@media screen and (min-width: 768px) {
		.desktop-pair {
			display: flex;
			justify-content: center;
		}

		.mobile-single {
			display: none;
		}
	}

	/* Mobile layout: single card with controls */
	.mobile-single {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	@media screen and (min-width: 768px) {
		.mobile-single {
			display: none;
		}
	}

	.card-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		flex: 0 0 auto;
	}

	.card-container :global(.card) {
		width: 300px;
		height: 420px;
		max-width: 90vw;
		max-height: calc(90vw * 1.4);
	}

	.card-label {
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
		font-weight: 500;
	}

	.mobile-controls {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.side-toggle {
		padding: 0.5rem 1rem;
		border: 2px solid var(--ui-border, #e2e8f0);
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.side-toggle:hover {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.side-toggle.active {
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.swipe-hint {
		font-size: 0.75rem;
		color: var(--ui-muted, #64748b);
		text-align: center;
		margin-top: 0.5rem;
		font-style: italic;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--ui-muted, #64748b);
		font-style: italic;
		min-height: 200px;
	}

	/* Touch feedback */
	.card-pair.mobile {
		touch-action: pan-y; /* Allow vertical scrolling, prevent horizontal */
	}

	@media screen and (max-width: 767px) {
		.mobile-card-list {
			padding: 0.5rem;
			gap: 1.5rem;
		}

		.card-container :global(.card) {
			width: min(300px, 85vw);
			height: min(420px, calc(85vw * 1.4));
		}
	}
</style>
