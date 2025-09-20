<script lang="ts">
    import PaginatedPages from '$lib/next/components/page/PaginatedPages.svelte';
    import AppHeader from '$lib/next/components/nav/Header.svelte';

    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
    import { importFromCurrentUrl } from '$lib/next/utils/shareUrlUtils.js';
    import { toasts } from '$lib/stores/toast.js';
    import { onMount } from 'svelte';

    let isInitializing = $state(true);
    let showCardBacks = $state(true);

    // Get deck and derived state
    let deck = $derived(nextDeckStore.deck);
    let cards = $derived(deck?.cards || []);
    let deckTitle = $derived(deck?.meta.title || 'Sample Deck');
    let layout = $derived(deck?.meta.layout || 'tarot');
    
    // Simple card count for UI logic
    let cardCount = $derived(cards?.length || 0);
    
    // Handle card backs visibility toggle from header
    function handleCardBacksToggle(event: CustomEvent<boolean>) {
        showCardBacks = event.detail;
    }

    async function loadSampleData() {
        try {
            return await nextDevStore.setupTestEnvironment();
        } catch (error) {
            return false;
        }
    }

    async function initializePage() {
        try {
            // First priority: Check if there's a share URL to import
            const importedDeck = importFromCurrentUrl();
            if (importedDeck) {
                await nextDeckStore.loadDeck(importedDeck);
                toasts.success(`🎉 Deck "${importedDeck.meta.title}" imported from URL!`);
                // Clear the URL hash to prevent re-importing
                // Commented out to preserve URL during merge workflow
                // if (typeof window !== 'undefined') {
                //     window.history.replaceState({}, '', window.location.pathname);
                // }
                isInitializing = false;
                return;
            }
            
            // Check if we already have a deck loaded
            if (nextDeckStore.deck) {
                isInitializing = false;
                return;
            }
            
            // Second priority: Load the most recent deck from database
            const hasExistingDeck = await nextDeckStore.loadMostRecent();
            
            // Last resort: Create sample data if no existing deck
            if (!hasExistingDeck) {
                const success = await loadSampleData();
                if (!success) {
                }
            }
            
        } catch (error) {
            console.error('Error during page initialization:', error);
            toasts.error('Failed to initialize page');
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
    <AppHeader on:cardBacksToggle={handleCardBacksToggle} />
    
    {#if isInitializing}
        <p>Initializing...</p>
    {:else if nextDeckStore.error}
        <p style="color: red;">❌ {nextDeckStore.error}</p>
    {:else if !deck && nextDeckStore.isLoading}
        <p>⏳ {nextDeckStore.loadingMessage}</p>
    {:else if cardCount === 0}
        <p>No cards found. <button onclick={() => nextDevStore.setupTestEnvironment()}>Load Sample Data</button></p>
    {:else if deck}
        <!-- Paginated print-ready cards -->
        <!-- Show loading indicator but keep content visible during updates -->
        {#if nextDeckStore.isLoading}
            <div class="loading-overlay">⏳ {nextDeckStore.loadingMessage}</div>
        {/if}
        <PaginatedPages
            {cards}
            {layout}
            {showCardBacks}
        />
    {/if}
</section>

<style>
    .deck {
        margin: 20px auto;
        position: relative;
    }
    
    .loading-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        z-index: 1000;
        font-size: 14px;
    }
    :global(.page), :global(.page *) {
        box-sizing: border-box;
    }

    :global(body) {
        margin: 0;
        padding: 0;
    }
    
    /* Print styles - hide header when printing */
    @media print {
        :global(.app-header) {
            display: none !important;
        }
        
        .deck {
            margin: 0;
        }
    }
</style>
