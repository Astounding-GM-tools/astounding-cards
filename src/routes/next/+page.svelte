<script lang="ts">
    import PaginatedPages from '$lib/next/components/page/PaginatedPages.svelte';
    import AppHeader from '$lib/next/components/nav/Header.svelte';

    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
    import { onMount } from 'svelte';

    let isInitializing = $state(true);

    // Get deck and derived state
    let deck = $derived(nextDeckStore.deck);
    let cards = $derived(deck?.cards || []);
    let deckTitle = $derived(deck?.meta.title || 'Sample Deck');
    let layout = $derived(deck?.meta.layout || 'tarot');
    
    // Simple card count for UI logic
    let cardCount = $derived(cards?.length || 0);

    async function loadSampleData() {
        try {
            return await nextDevStore.setupTestEnvironment();
        } catch (error) {
            console.error('Error loading sample data:', error);
            return false;
        }
    }

    async function initializePage() {
        try {
            // Check if we already have a deck loaded
            if (nextDeckStore.deck) {
                isInitializing = false;
                return;
            }
            
            // First, try to load the most recent deck from database
            const hasExistingDeck = await nextDeckStore.loadMostRecent();
            
            // If no existing deck, create sample data
            if (!hasExistingDeck) {
                const success = await loadSampleData();
                if (!success) {
                    console.warn('Failed to load sample data, but continuing...');
                }
            }
            
        } catch (error) {
            console.error('Error during page initialization:', error);
        } finally {
            // Always set initializing to false, regardless of success/failure
            isInitializing = false;
        }
    }

    onMount(() => {
        initializePage();
    });
</script>

<section class="deck">
    <AppHeader />
    
    {#if isInitializing}
        <p>Initializing...</p>
    {:else if nextDeckStore.isLoading}
        <p>⏳ {nextDeckStore.loadingMessage}</p>
    {:else if nextDeckStore.error}
        <p style="color: red;">❌ {nextDeckStore.error}</p>
    {:else if cardCount === 0}
        <p>No cards found. <button onclick={() => nextDevStore.setupTestEnvironment()}>Load Sample Data</button></p>
    {:else}
        <!-- Paginated print-ready cards -->
        <PaginatedPages
            {cards}
            {layout}
        />
    {/if}
</section>

<style>
    .deck {
        margin: 20px auto;
    }
    :global(.page), :global(.page *) {
        box-sizing: border-box;
    }

    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>
