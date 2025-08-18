<script lang="ts">
    import type { Trait } from '$lib/next/types/card';
    
    import Page from '$lib/next/components/page/Page.svelte';
    import Card from '$lib/next/components/card/Card.svelte';
    import Header from '$lib/next/components/header/Header.svelte';
    import StatFocus from '$lib/next/components/stats/StatFocus.svelte';
    import StatBlock from '$lib/next/components/stats/StatBlock.svelte';
    import TraitList from '$lib/next/components/traits/TraitList.svelte';
    import Dialog from '$lib/next/components/dialog/Dialog.svelte';

    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
    import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.js';
    import SomeContent from '$lib/components/SomeContent/SomeContent.svelte';
    import { onMount } from 'svelte';

    let isPoker = false;
    let isInitializing = true;

    // Get layout preference from deck or default to tarot
    $: layout = nextDeckStore.deck?.meta.layout || 'tarot';
    $: cards = nextDeckStore.deck?.cards || [];
    $: deckTitle = nextDeckStore.deck?.meta.title || 'Sample Deck';
    
    // Debug logging for reactive state
    $: {
        console.log('Reactive state update:', {
            hasDeck: !!nextDeckStore.deck,
            cardCount: cards.length,
            isInitializing,
            storeLoading: nextDeckStore.isLoading,
            storeError: nextDeckStore.error
        });
    }

    function openDialog() {
        dialogStore.setContent(SomeContent);
    }

    async function loadSampleData() {
        console.log('Loading sample data...');
        const success = await nextDevStore.setupTestEnvironment();
        if (success) {
            console.log('Sample data loaded successfully!');
        } else {
            console.error('Failed to setup sample data');
        }
        return success;
    }

    async function initializePage() {
        console.log('Initializing page...');
        
        // Check if we already have a deck loaded
        if (nextDeckStore.deck) {
            console.log('Deck already loaded:', nextDeckStore.deck.meta.title);
            isInitializing = false;
            return;
        }
        
        // Try to load sample data
        await loadSampleData();
        isInitializing = false;
    }

    onMount(() => {
        initializePage();
    });
</script>

<section class="deck">
    <h1>{deckTitle}</h1>
    
    <div class="debug-info">
        <h3>Debug Info:</h3>
        <ul>
            <li>Has Deck: {!!nextDeckStore.deck ? '✅' : '❌'}</li>
            <li>Deck ID: {nextDeckStore.deck?.id || 'None'}</li>
            <li>Card Count: {cards.length}</li>
            <li>Is Initializing: {isInitializing ? '⏳' : '✅'}</li>
            <li>Store Loading: {nextDeckStore.isLoading ? '⏳' : '✅'}</li>
            <li>Store Error: {nextDeckStore.error || 'None'}</li>
        </ul>
    </div>

    <nav>
        <button onclick={() => openDialog()}>
            Open Dialog
        </button>
        <button onclick={() => loadSampleData()}>
            Load Sample Data
        </button>
        <button onclick={() => nextDevStore.clearDatabase()}>
            Clear Data
        </button>
        <button onclick={() => {
            console.log('Current store state:', {
                deck: nextDeckStore.deck,
                cards: cards,
                loading: nextDeckStore.isLoading,
                error: nextDeckStore.error
            });
        }}>
            Log Store State
        </button>
    </nav>
    
    <label>
        <input type="checkbox" bind:checked={isPoker} />
        {isPoker ? 'Poker' : 'Tarot'} size ({cards.length} cards)
    </label>
    
    {#if isInitializing}
        <p>Initializing...</p>
    {:else if nextDeckStore.isLoading}
        <p>⏳ {nextDeckStore.loadingMessage}</p>
    {:else if nextDeckStore.error}
        <p style="color: red;">❌ {nextDeckStore.error}</p>
    {:else if cards.length === 0}
        <p>No cards found. <button onclick={() => nextDevStore.setupTestEnvironment()}>Load Sample Data</button></p>
    {:else}
        <!-- Card Fronts -->
        <Page layout={isPoker ? 'poker' : 'tarot'}>
            {#each cards as card}
                <Card>
                    <Header 
                        title={card.title} 
                        subtitle={card.subtitle} 
                    />
                    <StatFocus stats={card.stats} />
                    <TraitList traits={card.traits.filter((trait: Trait) => trait.isPublic)} />
                </Card>
            {/each}
        </Page>

        <!-- Card Backs -->
        <Page layout={isPoker ? 'poker' : 'tarot'}>
            {#each cards as card}
                <Card>
                    <Header 
                        back
                        title={card.title} 
                        subtitle={card.description} 
                     />
                    <StatBlock stats={card.stats} />
                    <TraitList traits={card.traits.filter((trait: Trait) => !trait.isPublic)} />
                </Card>
            {/each}
        </Page>
    {/if}
</section>

<!-- Include the dialog component -->
<Dialog />

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
    
    h1 {
        margin-bottom: 1rem;
    }
    
    label {
        display: block;
        margin-bottom: 1rem;
    }
</style>
