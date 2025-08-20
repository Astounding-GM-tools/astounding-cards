<script lang="ts">
    import type { Card as TCard, Trait } from '$lib/next/types/card';
    import type { PageLayout } from '$lib/next/components/page/types';
    
    import Page from '$lib/next/components/page/Page.svelte';
    import Card from '$lib/next/components/card/Card.svelte';
    import Header from '$lib/next/components/header/Header.svelte';
    import StatFocus from '$lib/next/components/stats/StatFocus.svelte';
    import StatBlock from '$lib/next/components/stats/StatBlock.svelte';
    import TraitList from '$lib/next/components/traits/TraitList.svelte';
    import CardImage from '$lib/next/components/image/CardImage.svelte';
    import Dialog from '$lib/next/components/dialog/Dialog.svelte';

    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
    import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.js';
    import CardEditDialog from '$lib/next/components/dialogs/CardEditDialog.svelte';
    import { onMount } from 'svelte';

    let isPoker = $state(false);
    let isInitializing = $state(true);
    let selectedCardId = $state<string | null>(null);

    // Get layout preference from deck or default to tarot, but allow override
    let layout = $derived(isPoker ? 'poker' : 'tarot');
    let cards = $derived(nextDeckStore.deck?.cards || []);
    let deckTitle = $derived(nextDeckStore.deck?.meta.title || 'Sample Deck');
    
    // Simple card count for UI logic
    let cardCount = $derived(cards?.length || 0);

    function openCardEditor(card: TCard) {
        selectedCardId = card.id;
        dialogStore.setContent(CardEditDialogSnippet);
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
    <h1>{deckTitle}</h1>
    
    <nav>
        <button onclick={() => loadSampleData()}>
            Load Sample Data
        </button>
        <button onclick={() => nextDevStore.clearDatabase()}>
            Clear Database
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
    {:else if cardCount === 0}
        <p>No cards found. <button onclick={() => nextDevStore.setupTestEnvironment()}>Load Sample Data</button></p>
    {:else}
        <!-- Card Fronts -->
        <Page layout={layout as PageLayout}>
            {#each cards as card}
                <Card>
                    <button 
                        class="card-edit-overlay"
                        onclick={() => openCardEditor(card)}
                        title="Click to edit {card.title}"
                    >
                        <CardImage {card} />
                        <Header 
                            title={card.title} 
                            subtitle={card.subtitle} 
                        />
                        <StatFocus stats={card.stats} />
                        <TraitList traits={card.traits.filter((trait: Trait) => trait.isPublic)} />
                    </button>
                </Card>
            {/each}
        </Page>

        <!-- Card Backs -->
        <Page layout={layout as PageLayout}>
            {#each cards as card}
                <Card>
                    <button 
                        class="card-edit-overlay"
                        onclick={() => openCardEditor(card)}
                        title="Click to edit {card.title}"
                    >
                        <Header 
                            back
                            title={card.title} 
                            subtitle={card.description} 
                         />
                        <StatBlock stats={card.stats} />
                        <TraitList traits={card.traits.filter((trait: Trait) => !trait.isPublic)} />
                    </button>
                </Card>
            {/each}
        </Page>
    {/if}
</section>

<!-- Snippets for dialog content -->
{#snippet CardEditDialogSnippet()}
    {#if selectedCardId}
        <CardEditDialog cardId={selectedCardId} />
    {:else}
        <div>No card selected</div>
    {/if}
{/snippet}

<!-- Include the dialog component -->
<Dialog />

<style>
    .deck {
        margin: 20px auto;
    }
    
    .card-edit-overlay {
        all: unset;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        cursor: pointer;
        transition: opacity 0.2s ease;
    }
    
    .card-edit-overlay:hover {
        opacity: 0.9;
    }
    
    .card-edit-overlay:active {
        transform: scale(0.98);
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
