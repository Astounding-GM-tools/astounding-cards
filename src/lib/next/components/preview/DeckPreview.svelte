<script lang="ts">
    import type { Deck } from '../../types/deck.js';
    import Card from '../card/Card.svelte';
    import CardFrontContent from '../card/CardFrontContent.svelte';
    import CardBackContent from '../card/CardBackContent.svelte';
    
    interface Props {
        deck: Deck;
    }
    
    let { deck }: Props = $props();
    
    // Track which cards are showing back side
    let showingBack = $state(new Set<string>());
    
    function toggleCardSide(cardId: string) {
        if (showingBack.has(cardId)) {
            showingBack.delete(cardId);
        } else {
            showingBack.add(cardId);
        }
        showingBack = new Set(showingBack); // Trigger reactivity
    }
    
    function isShowingBack(cardId: string): boolean {
        return showingBack.has(cardId);
    }
</script>

<div class="deck-preview">
    <div class="cards-grid">
        {#each deck.cards as card (card.id)}
            <div class="card-wrapper">
                <div class="card-display">
                    <Card preview={true}>
                        {#if isShowingBack(card.id)}
                            <CardBackContent {card} />
                        {:else}
                            <CardFrontContent {card} />
                        {/if}
                    </Card>
                </div>
                <div class="card-controls">
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
            </div>
        {/each}
    </div>
</div>

<style>
    .deck-preview {
        width: 100%;
    }
    
    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 2rem;
        padding: 1rem 0;
    }
    
    @media (max-width: 640px) {
        .cards-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }
    }
    
    .card-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .card-display {
        width: 100%;
        height: auto;
        aspect-ratio: 5/7;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .card-display:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .card-controls {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }
    
    .side-toggle {
        padding: 0.5rem 1rem;
        background: var(--ui-hover-bg, #f8fafc);
        color: var(--ui-muted, #64748b);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        flex: 1;
    }
    
    .side-toggle:hover {
        background: var(--ui-border, #e2e8f0);
    }
    
    .side-toggle.active {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
        border-color: var(--button-primary-bg, #3b82f6);
    }
    
    .side-toggle.active:hover {
        background: var(--button-primary-hover-bg, #2563eb);
    }
</style>
