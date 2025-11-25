<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import DeckViewer from '$lib/next/components/page/DeckViewer.svelte';
	import DeckPreview from '$lib/next/components/preview/DeckPreview.svelte';
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.js';
	import { CardEditDialog } from '$lib/next/components/dialogs/index.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
	import { nextDb } from '$lib/next/stores/database.js';
	import { toasts } from '$lib/stores/toast.js';
	import { generateId } from '$lib/next/utils/idUtils.js';
	import {
		getStarted,
		howItWorks,
		joinUss,
		whatIsAstounding
	} from '$lib/components/content/content';
	import Content from '$lib/components/content/Content.svelte';
	import type { Deck } from '$lib/next/types/deck';
	import { deckToCard } from '$lib/next/utils/deckToCard';

	let heroDeck = $state<any | null>(null); // Most liked deck from API
	let featuredDecksData = $state<any[]>([]); // Top 4-8 most liked decks (excluding #1)
	let isLoadingHero = $state(true);
	let isLoadingFeatured = $state(true);

	// Transform featured decks into a "meta-deck" - a deck where each card represents a deck!
	let featuredDecksMeta = $derived<Deck>({
		id: 'featured',
		meta: {
			title: 'Featured Decks',
			theme: 'classic',
			imageStyle: 'classic',
			layout: 'poker',
			lastEdited: Date.now(),
			createdAt: Date.now()
		},
		cards: featuredDecksData.map((deck) => deckToCard(deck))
	});

	// Transform API deck to Deck type with limited cards
	let heroDeckPreview = $derived<Deck | null>(
		heroDeck
			? {
					id: heroDeck.id,
					meta: {
						title: heroDeck.title,
						theme: heroDeck.theme,
						imageStyle: heroDeck.imageStyle || 'classic',
						layout: heroDeck.layout || 'poker',
						lastEdited: new Date(heroDeck.updated_at).getTime(),
						createdAt: new Date(heroDeck.created_at).getTime()
					},
					cards: heroDeck.cards.slice(0, 4) // Only first 4 cards for hero
				}
			: null
	);

	async function loadHeroDeck() {
		try {
			const response = await fetch('/api/decks/featured?limit=1');
			if (!response.ok) {
				throw new Error('Failed to load featured deck');
			}

			const result = await response.json();
			if (result.decks && result.decks.length > 0) {
				heroDeck = result.decks[0];
			} else {
				// Fallback: load user's most recent deck
				await loadLocalFallbackDeck();
			}
		} catch (error) {
			console.error('Failed to load hero deck:', error);
			// Fallback: load user's most recent deck
			await loadLocalFallbackDeck();
		} finally {
			isLoadingHero = false;
		}
	}

	async function loadLocalFallbackDeck() {
		try {
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
				// Transform local deck to API format
				heroDeck = {
					id: deck.id,
					slug: deck.id,
					title: deck.meta.title,
					theme: deck.meta.theme,
					imageStyle: deck.meta.imageStyle,
					layout: deck.meta.layout,
					cards: deck.cards,
					like_count: 0,
					created_at: new Date(deck.meta.createdAt).toISOString(),
					updated_at: new Date(deck.meta.lastEdited).toISOString()
				};
			}
		} catch (error) {
			console.error('Failed to load fallback deck:', error);
		}
	}

	async function loadFeaturedDecks() {
		try {
			// Exclude the hero deck if we have one
			const excludeParam = heroDeck ? `&exclude=${heroDeck.id}` : '';
			const response = await fetch(`/api/decks/featured?limit=8${excludeParam}`);

			if (!response.ok) {
				throw new Error('Failed to load featured decks');
			}

			const result = await response.json();
			if (result.decks && result.decks.length > 0) {
				featuredDecksData = result.decks;
			}
		} catch (error) {
			console.error('Failed to load featured decks:', error);
		} finally {
			isLoadingFeatured = false;
		}
	}

	function handleViewFullDeck() {
		if (heroDeck) {
			goto(`/${heroDeck.slug}`);
		}
	}

	function handlePreviewDeck(deckId: string) {
		// Find the deck by ID in featuredDecksData
		const deck = featuredDecksData.find((d) => d.id === deckId);
		if (deck) {
			goto(`/${deck.slug}`);
		}
	}

	async function handleEditHeroCard(cardId: string) {
		// Import the deck silently if needed and open the card editor
		if (!heroDeck) return;

		try {
			// Simple logic: Do I have this deck ID locally?
			const existingLocal = await nextDb.getDeck(heroDeck.id);

			if (existingLocal) {
				// I already have this deck - just load it
				await nextDeckStore.loadDeck(existingLocal.id);
			} else {
				// I don't have it - import it (keeping original title and dates)
				const now = Date.now();
				const originalCreatedAt = heroDeck.created_at
					? new Date(heroDeck.created_at).getTime()
					: now;

				const newDeck: Deck = {
					id: heroDeck.id, // Keep the original ID!
					meta: {
						title: heroDeck.title, // Keep original title!
						theme: heroDeck.theme,
						imageStyle: heroDeck.imageStyle || 'classic',
						layout: heroDeck.layout || 'poker',
						lastEdited: now,
						createdAt: originalCreatedAt, // Preserve original creation date
						creator_id: heroDeck.user_id, // Capture creator
						creator_name: heroDeck.creator_name || 'Unknown',
						remix_of: heroDeck.id // Track remix lineage (published deck ID)
					},
					cards: heroDeck.cards
				};

				// Save to database
				await nextDb.upsertDeck(newDeck);

				// Load the deck
				await nextDeckStore.loadDeck(newDeck.id);

				// Show toast on first import
				toasts.success(`✅ Deck imported to your library!`);
			}

			// Find the card in the deck by matching the original cardId
			const deck = nextDeckStore.deck;
			if (deck) {
				const cardIndex = heroDeck.cards.findIndex((c: any) => c.id === cardId);
				if (cardIndex !== -1 && deck.cards[cardIndex]) {
					// Open the card editor with the corresponding card
					dialogStore.setContent(CardEditDialog, { cardId: deck.cards[cardIndex].id });
				}
			}
		} catch (err) {
			console.error('Edit error:', err);
			toasts.error(err instanceof Error ? err.message : 'Failed to open editor');
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

	onMount(async () => {
		await loadHeroDeck();
		await loadFeaturedDecks(); // Load after hero so we can exclude it
	});
</script>

<MainHeader title="Astounding Cards" />

<div class="landing-page">
	<!-- Hero Section: Most Liked Deck -->
	{#if isLoadingHero}
		<div class="cards-hero">
			<div class="loading-state">Loading featured deck...</div>
		</div>
	{:else if heroDeckPreview}
		<div class="cards-hero">
			<DeckPreview deck={heroDeckPreview} onEdit={handleEditHeroCard} />
		</div>

		<div class="hero-actions">
			<button class="cta-primary" onclick={handleViewFullDeck}>
				View Full Deck ({heroDeck?.cardCount || heroDeck?.cards?.length || 0} cards)
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
			<h2>Popular Decks</h2>
			{#if isLoadingFeatured}
				<div class="loading-state">Loading popular decks...</div>
			{:else if featuredDecksData.length > 0}
				<div class="featured-decks-container">
					<DeckPreview deck={featuredDecksMeta} onEdit={handlePreviewDeck} mode="deck" />
				</div>
			{:else}
				<div class="empty-state">
					<p>No published decks yet. Be the first to share your creation!</p>
				</div>
			{/if}
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

<Dialog />

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

	.loading-state {
		padding: 3rem;
		text-align: center;
		color: var(--ui-muted, #64748b);
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--ui-muted, #64748b);
	}

	.featured-decks-container {
		margin-top: 2rem;
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
