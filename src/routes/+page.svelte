<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import DeckViewer from '$lib/next/components/page/DeckViewer.svelte';
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
	import {
		getStarted,
		howItWorks,
		joinUss,
		whatIsAstounding
	} from '$lib/components/content/content';
	import Content from '$lib/components/content/Content.svelte';

	let featuredDeckId = $state<string | null>(null);
	let cardCount = $state(0);

	async function loadFeaturedDeck() {
		try {
			// Try to load current deck, or most recent, or create sample
			let deck = nextDeckStore.deck;

			if (!deck) {
				const hasExisting = await nextDeckStore.loadMostRecent();
				if (!hasExisting) {
					await nextDevStore.setupTestEnvironment();
					deck = nextDeckStore.deck;
				} else {
					deck = nextDeckStore.deck;
				}
			}

			if (deck) {
				featuredDeckId = deck.id;
				cardCount = deck.cards.length;
			}
		} catch (error) {
			console.error('Failed to load featured deck:', error);
		}
	}

	function handleViewFullDeck() {
		if (featuredDeckId) {
			goto(`/${featuredDeckId}`);
		}
	}

	async function handleCreateDeck() {
		try {
			const newDeck = await nextDeckStore.createNewDeck();
			if (newDeck) {
				goto(`/${newDeck.id}`);
			}
		} catch (error) {
			console.error('Failed to create deck:', error);
		}
	}

	onMount(() => {
		loadFeaturedDeck();
	});
</script>

<MainHeader title="Astounding Cards" />

<div class="landing-page">
	<!-- Hero Section: Just the cards, nothing else -->
	{#if featuredDeckId}
		<div class="cards-hero">
			<DeckViewer slug={featuredDeckId} limitCards={4} />
		</div>

		<div class="hero-actions">
			<button class="cta-primary" onclick={handleViewFullDeck}>
				View Full Deck ({cardCount} cards)
			</button>
			<button class="cta-secondary" onclick={handleCreateDeck}> Create Your Own </button>
		</div>
	{/if}

	<!-- Marketing Content Placeholders -->

	<section class="content-section">
		<div class="section-inner">
			<Content blocks={whatIsAstounding} />
		</div>
	</section>

	<section class="content-section alt">
		<div class="section-inner">
			<Content blocks={howItWorks} />
		</div>
	</section>

	<section class="content-section">
		<div class="section-inner">
			<h2>Featured Decks</h2>
			<div class="placeholder">[Gallery of 4-6 popular community decks]</div>
		</div>
	</section>

	<section class="content-section alt">
		<div class="section-inner">
			<Content blocks={joinUss} />
		</div>
	</section>

	<section class="content-section">
		<div class="section-inner">
			<Content blocks={getStarted} />
		</div>
	</section>
</div>

<style>
	.landing-page {
		min-height: 100vh;
		background: white;
	}

	/* Cards hero - just the cards, no embellishments */
	.cards-hero {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.cards-hero :global(.deck-preview) {
		margin: 0 auto;
	}

	/* CTAs */
	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.cta-primary,
	.cta-secondary {
		padding: 1rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		border-radius: 6px;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.cta-primary {
		background: var(--ui-text, #1e293b);
		color: white;
	}

	.cta-primary:hover {
		background: var(--ui-muted, #64748b);
	}

	.cta-secondary {
		background: white;
		color: var(--ui-text, #1e293b);
		border: 2px solid var(--ui-border, #e2e8f0);
	}

	.cta-secondary:hover {
		border-color: var(--ui-text, #1e293b);
	}

	/* Content Sections */
	.content-section {
		padding: 4rem 2rem;
	}

	.content-section.alt {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.section-inner {
		max-width: 1200px;
		margin: 0 auto;
	}

	.content-section h2 {
		font-size: 2.5rem;
		margin: 0 0 1.5rem;
		text-align: center;
		color: var(--ui-text, #1e293b);
	}

	.placeholder {
		padding: 3rem;
		background: var(--ui-border, #e2e8f0);
		border-radius: 8px;
		text-align: center;
		color: var(--ui-muted, #64748b);
		font-style: italic;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-actions {
			flex-direction: column;
		}

		.cta-primary,
		.cta-secondary {
			width: 100%;
		}
	}
</style>
