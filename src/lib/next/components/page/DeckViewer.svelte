<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import DeckPreview from '../preview/DeckPreview.svelte';
	import Dialog from '../dialog/Dialog.svelte';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { nextDb } from '$lib/next/stores/database.js';
	import { toasts } from '$lib/stores/toast.js';
	import type { Deck } from '../../types/deck';

	interface Props {
		slug?: string; // Deck ID to load
		deck?: Deck; // Or provide deck directly
		limitCards?: number; // Optionally limit to N cards (e.g., 4 for landing page)
		showDialog?: boolean; // Whether to render Dialog component (default true)
	}

	let { slug, deck: providedDeck, limitCards, showDialog = true }: Props = $props();

	let isLoading = $state(true);
	let loadedDeck = $state<Deck | null>(null);
	let error = $state<string | null>(null);

	// Active deck - either provided or loaded
	let activeDeck = $derived(providedDeck || loadedDeck);

	// Preview cards - optionally limited
	let previewCards = $derived(
		limitCards && activeDeck ? activeDeck.cards.slice(0, limitCards) : activeDeck?.cards || []
	);

	let previewDeck = $derived(
		activeDeck ? { ...activeDeck, cards: previewCards } : null
	);

	async function loadDeck() {
		if (providedDeck) {
			isLoading = false;
			return;
		}

		if (!slug) {
			error = 'No deck ID provided';
			isLoading = false;
			return;
		}

		try {
			// Try to load from local DB
			const deck = await nextDb.getDeck(slug);
			if (deck) {
				loadedDeck = deck;
			} else {
				error = 'Deck not found';
			}
		} catch (err) {
			console.error('Failed to load deck:', err);
			error = 'Failed to load deck';
		} finally {
			isLoading = false;
		}
	}

	async function handleEdit(cardId: string) {
		if (!activeDeck) return;

		try {
			// Check if this deck is already loaded in the store
			const currentDeck = nextDeckStore.deck;
			const isDeckLoaded = currentDeck && currentDeck.id === activeDeck.id;

			if (!isDeckLoaded) {
				// Load this deck into the store
				await nextDeckStore.loadDeck(activeDeck.id);
			}

			// Navigate to Edit Mode with this card
			goto(`/${activeDeck.id}/edit/${cardId}`);
		} catch (err) {
			console.error('Failed to open editor:', err);
			toasts.error('Failed to open editor');
		}
	}

	onMount(() => {
		loadDeck();
	});
</script>

{#if isLoading}
	<div class="loading">Loading...</div>
{:else if error}
	<div class="error">{error}</div>
{:else if previewDeck}
	<DeckPreview deck={previewDeck} onEdit={handleEdit} />
{/if}

{#if showDialog}
	<Dialog />
{/if}

<style>
	.loading,
	.error {
		padding: 2rem;
		text-align: center;
		color: var(--ui-muted, #64748b);
	}

	.error {
		color: var(--ui-error, #ef4444);
	}
</style>
