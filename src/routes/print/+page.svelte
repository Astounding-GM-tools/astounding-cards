<script lang="ts">
    import Card from '$lib/next/components/card/Card.svelte';
    import CardFrontContent from '$lib/next/components/card/CardFrontContent.svelte';
    import CardBackContent from '$lib/next/components/card/CardBackContent.svelte';

    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
    import { importFromCurrentUrl } from '$lib/next/utils/shareUrlUtils.js';
    import { toasts } from '$lib/stores/toast.js';
    import { onMount } from 'svelte';
    import '$lib/next/styles/properties.css';

    let isInitializing = $state(true);
    let showCardBacks = $state(true);

    // Get deck and derived state
    let deck = $derived(nextDeckStore.deck);
    let cards = $derived(deck?.cards || []);
    let deckTitle = $derived(deck?.meta.title || 'Sample Deck');
    let layout = $derived(deck?.meta.layout || 'tarot');
    
    // Simple card count for UI logic
    let cardCount = $derived(cards?.length || 0);
    
    // Working pagination function (from old PagedCards)
    function getPagedCards(cards: any[], layout: string) {
        const cardsPerPage = layout === 'poker' ? 9 : 4;
        const pages = [];
        
        for (let i = 0; i < cards.length; i += cardsPerPage) {
            pages.push(cards.slice(i, i + cardsPerPage));
        }
        
        return pages;
    }

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
            // First priority: Check if there's a share URL to import
            const importedDeck = importFromCurrentUrl();
            if (importedDeck) {
                await nextDeckStore.loadDeck(importedDeck);
                toasts.success(`🎉 Deck "${importedDeck.meta.title}" imported from URL!`);
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
                    console.warn('Failed to load sample data, but continuing...');
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

<section class="print-preview">
    <div class="header">
        <h1>Print Preview - {deckTitle}</h1>
        <p>Layout: <strong>{layout.toUpperCase()}</strong></p>
        <label>
            <input type="checkbox" bind:checked={showCardBacks} />
            Show card backs
        </label>
        <a href="/" class="back-link">← Back to editor</a>
    </div>
    
    {#if isInitializing}
        <p>Initializing...</p>
    {:else if nextDeckStore.error}
        <p style="color: red;">❌ {nextDeckStore.error}</p>
    {:else if !deck && nextDeckStore.isLoading}
        <p>⏳ {nextDeckStore.loadingMessage}</p>
    {:else if cardCount === 0}
        <p>No cards found. <button onclick={() => nextDevStore.setupTestEnvironment()}>Load Sample Data</button></p>
    {:else if deck}
        <!-- Show loading indicator but keep content visible during updates -->
        {#if nextDeckStore.isLoading}
            <div class="loading-overlay">⏳ {nextDeckStore.loadingMessage}</div>
        {/if}
        
        <!-- Always show print layout -->
        <div class="print-layout">
            {#each getPagedCards(cards, layout) as page, pageIndex}
                <!-- Front page -->
                <div class="page" data-layout={layout} class:last-page={!showCardBacks && pageIndex === getPagedCards(cards, layout).length - 1}>
                    <div class="card-grid">
                        {#each page as card (card.id)}
                            <Card cardId={card.id}>
                                <CardFrontContent {card} />
                            </Card>
                        {/each}
                    </div>
                </div>
                
                <!-- Back page (if enabled) -->
                {#if showCardBacks}
                    <div class="page" data-layout={layout} class:last-page={pageIndex === getPagedCards(cards, layout).length - 1}>
                        <div class="card-grid back-grid">
                            {#each page as card (card.id)}
                                <Card cardId={card.id}>
                                    <CardBackContent {card} />
                                </Card>
                            {/each}
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</section>

<style>
    .print-preview {
        margin: 20px auto;
        position: relative;
    }
    
    .header {
        margin-bottom: 20px;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
    }
    
    .header h1 {
        margin: 0;
        font-size: 1.5rem;
    }
    
    .header p {
        margin: 0;
    }
    
    .header label {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .back-link {
        color: #0066cc;
        text-decoration: none;
        margin-left: auto;
    }
    
    .back-link:hover {
        text-decoration: underline;
    }
    
    /* Print layout CSS (copied from main page) */
    .print-layout .page {
        width: 210mm;
        height: 297mm;
        margin: 0 auto 20mm;
        padding: 10mm;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        position: relative;
        page-break-after: always;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .print-layout .card-grid {
        width: 100%;
        height: 100%;
        display: grid;
        gap: 0;
    }
    
    /* Tarot layout: 2x2 grid */
    .print-layout .page[data-layout="tarot"] .card-grid {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
    }
    
    /* Poker layout: 3x3 grid */
    .print-layout .page[data-layout="poker"] .card-grid {
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
    }
    
    /* Back page - reverse for double-sided printing */
    .print-layout .back-grid {
        direction: rtl;
    }
    
    .print-layout .back-grid :global(.card) {
        direction: ltr;
    }
    
    /* Remove page break from last page to prevent blank page */
    .print-layout .page.last-page {
        page-break-after: auto !important;
        margin-bottom: 0 !important;
    }
    
    /* Ensure crop marks use border-box sizing */
    .print-layout :global(.crop-mark) {
        box-sizing: border-box !important;
    }
    
    /* CROP MARKS: Show all crop marks that touch page edges */
    
    /* TAROT LAYOUT (2x2 grid) */
    /* Top edge: cards 1,2 show both top crop marks */
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(-n+2) .crop-mark.top-left),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(-n+2) .crop-mark.top-right) {
        display: block;
    }
    
    /* Bottom edge: cards 3,4 show both bottom crop marks */
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(n+3) .crop-mark.bottom-left),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(n+3) .crop-mark.bottom-right) {
        display: block;
    }
    
    /* Left edge: cards 1,3 show both left crop marks */
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(odd) .crop-mark.top-left),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(odd) .crop-mark.bottom-left) {
        display: block;
    }
    
    /* Right edge: cards 2,4 show both right crop marks */
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(even) .crop-mark.top-right),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(even) .crop-mark.bottom-right) {
        display: block;
    }
    
    /* POKER LAYOUT (3x3 grid) */
    /* Top edge: cards 1,2,3 show both top crop marks */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(-n+3) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(-n+3) .crop-mark.top-right) {
        display: block;
    }
    
    /* Bottom edge: cards 7,8,9 show both bottom crop marks */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(n+7) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(n+7) .crop-mark.bottom-right) {
        display: block;
    }
    
    /* Left edge: cards 1,4,7 show both left crop marks */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(3n+1) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(3n+1) .crop-mark.bottom-left) {
        display: block;
    }
    
    /* Right edge: cards 3,6,9 show both right crop marks */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(3n) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(3n) .crop-mark.bottom-right) {
        display: block;
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
    
    /* CROP MARK THICKNESS ADJUSTMENTS for perfect visual weight */
    
    /* TAROT LAYOUT (2x2 grid) */
    /* Adjacent horizontal crop marks - make vertical borders thinner */
    /* Cards 1&2 horizontal adjacency */
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(1) .crop-mark.top-right),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(1) .crop-mark.bottom-right) {
        border-left-width: 0.5px;
    }
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(2) .crop-mark.top-left),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(2) .crop-mark.bottom-left) {
        border-right-width: 0.5px;
    }
    
    /* Cards 3&4 horizontal adjacency */
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(3) .crop-mark.top-right),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(3) .crop-mark.bottom-right) {
        border-left-width: 0.5px;
    }
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(4) .crop-mark.top-left),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(4) .crop-mark.bottom-left) {
        border-right-width: 0.5px;
    }
    
    /* Adjacent vertical crop marks - make horizontal borders thinner */
    /* Cards 1&3 vertical adjacency */
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(1) .crop-mark.bottom-left),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(1) .crop-mark.bottom-right) {
        border-top-width: 0.5px;
    }
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(3) .crop-mark.top-left),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(3) .crop-mark.top-right) {
        border-bottom-width: 0.5px;
    }
    
    /* Cards 2&4 vertical adjacency */
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(2) .crop-mark.bottom-left),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(2) .crop-mark.bottom-right) {
        border-top-width: 0.5px;
    }
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(4) .crop-mark.top-left),
    .print-layout .page[data-layout="tarot"] :global(.card:nth-child(4) .crop-mark.top-right) {
        border-bottom-width: 0.5px;
    }
    
    /* POKER LAYOUT (3x3 grid) */
    /* Adjacent horizontal crop marks - make vertical borders thinner */
    /* Row 1: Cards 1&2, 2&3 */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(1) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(1) .crop-mark.bottom-right) {
        border-left-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(2) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(2) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(2) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(2) .crop-mark.bottom-right) {
        border-right-width: 0.5px;
        border-left-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(3) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(3) .crop-mark.bottom-left) {
        border-right-width: 0.5px;
    }
    
    /* Row 2: Cards 4&5, 5&6 */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(4) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(4) .crop-mark.bottom-right) {
        border-left-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(5) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(5) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(5) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(5) .crop-mark.bottom-right) {
        border-right-width: 0.5px;
        border-left-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(6) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(6) .crop-mark.bottom-left) {
        border-right-width: 0.5px;
    }
    
    /* Row 3: Cards 7&8, 8&9 */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(7) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(7) .crop-mark.bottom-right) {
        border-left-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(8) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(8) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(8) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(8) .crop-mark.bottom-right) {
        border-right-width: 0.5px;
        border-left-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(9) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(9) .crop-mark.bottom-left) {
        border-right-width: 0.5px;
    }
    
    /* Adjacent vertical crop marks - make horizontal borders thinner */
    /* Column 1: Cards 1&4, 4&7 */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(1) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(1) .crop-mark.bottom-right) {
        border-top-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(4) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(4) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(4) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(4) .crop-mark.bottom-right) {
        border-bottom-width: 0.5px;
        border-top-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(7) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(7) .crop-mark.top-right) {
        border-bottom-width: 0.5px;
    }
    
    /* Column 2: Cards 2&5, 5&8 */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(2) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(2) .crop-mark.bottom-right) {
        border-top-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(5) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(5) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(5) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(5) .crop-mark.bottom-right) {
        border-bottom-width: 0.5px;
        border-top-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(8) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(8) .crop-mark.top-right) {
        border-bottom-width: 0.5px;
    }
    
    /* Column 3: Cards 3&6, 6&9 */
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(3) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(3) .crop-mark.bottom-right) {
        border-top-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(6) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(6) .crop-mark.top-right),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(6) .crop-mark.bottom-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(6) .crop-mark.bottom-right) {
        border-bottom-width: 0.5px;
        border-top-width: 0.5px;
    }
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(9) .crop-mark.top-left),
    .print-layout .page[data-layout="poker"] :global(.card:nth-child(9) .crop-mark.top-right) {
        border-bottom-width: 0.5px;
    }
    
    @media print {
        .header {
            display: none !important;
        }
        
        .print-layout .page {
            width: auto;
            height: auto;
            min-height: 100vh;
            margin: 0;
            box-shadow: none;
        }
        
        /* Ensure last page doesn't create blank page */
        .print-layout .page.last-page {
            page-break-after: auto !important;
        }
    }
</style>