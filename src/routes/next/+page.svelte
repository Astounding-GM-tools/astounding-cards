<script lang="ts">
    import type { Trait } from '$lib/next/types/card';
    import type { PageLayout } from '$lib/next/components/page/types';
    
    import Page from '$lib/next/components/page/Page.svelte';
    import Card from '$lib/next/components/card/Card.svelte';
    import Header from '$lib/next/components/header/Header.svelte';
    import StatFocus from '$lib/next/components/stats/StatFocus.svelte';
    import StatBlock from '$lib/next/components/stats/StatBlock.svelte';
    import TraitList from '$lib/next/components/traits/TraitList.svelte';
    import CardImage from '$lib/next/components/image/CardImage.svelte';
    import AppHeader from '$lib/next/components/nav/Header.svelte';

    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
    import { onMount } from 'svelte';

    let isPoker = $state(false);
    let isInitializing = $state(true);

    // Get layout preference from deck or default to tarot, but allow override
    let layout = $derived(isPoker ? 'poker' : 'tarot');
    let cards = $derived(nextDeckStore.deck?.cards || []);
    let deckTitle = $derived(nextDeckStore.deck?.meta.title || 'Sample Deck');
    
    // Simple card count for UI logic
    let cardCount = $derived(cards?.length || 0);
    
    // Handle layout toggle from header
    function handleLayoutToggle(newIsPoker: boolean) {
        isPoker = newIsPoker;
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
    <AppHeader {isPoker} onLayoutToggle={handleLayoutToggle} />
    
    {#if isInitializing}
        <p>Initializing...</p>
    {:else if nextDeckStore.isLoading}
        <p>⏳ {nextDeckStore.loadingMessage}</p>
    {:else if nextDeckStore.error}
        <p style="color: red;">❌ {nextDeckStore.error}</p>
    {:else if cardCount === 0}
        <p>No cards found. <button onclick={() => nextDevStore.setupTestEnvironment()}>Load Sample Data</button></p>
    {:else}
        <!-- Card Fronts -->
        <Page layout={layout as PageLayout}>
            {#each cards as card}
                <Card cardId={card.id}>
                    <CardImage {card} />
                    
                    <div class="card-content-front">
                        <Header title={card.title} subtitle={card.subtitle} />
                        <StatFocus stats={card.stats} />
                        <TraitList traits={card.traits.filter((trait: Trait) => trait.isPublic)} />
                    </div>
                </Card>
            {/each}
        </Page>

        <!-- Card Backs -->
        <Page layout={layout as PageLayout}>
            {#each cards as card}
                <Card cardId={card.id}>
                    <Header title={card.title} subtitle={card.description} />
                    <StatBlock stats={card.stats} />
                    <TraitList traits={card.traits.filter((trait: Trait) => !trait.isPublic)} />
                </Card>
            {/each}
        </Page>
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
    

    .card-content-front {
        display: flex;
        flex-direction: column;
        margin: auto 0.8em 0.8em 0.8em;
        background: white;
        border-radius: 0.2em;
        box-shadow: 0 0 0.6em 0 rgba(0, 0, 0, 0.1);
        z-index: 10;
    }
</style>
