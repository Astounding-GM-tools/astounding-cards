<script lang="ts">
    import type { Card as CardType } from '../../types/card.js';
    import type { Layout } from '../../types/deck.js';
    import { createPaginatedPages } from './pagination.js';
    import Page from './Page.svelte';
    import Card from '../card/Card.svelte';
    import CardFrontContent from '../card/CardFrontContent.svelte';
    import CardBackContent from '../card/CardBackContent.svelte';
    
    interface Props {
        cards: CardType[];
        layout: Layout;
        showCardBacks?: boolean;
    }
    
    let { cards, layout, showCardBacks = true }: Props = $props();
    
    // Generate paginated pages
    let allPages = $derived(createPaginatedPages(cards, layout));
    
    // Filter pages based on showCardBacks setting
    let paginatedPages = $derived(
        showCardBacks 
            ? allPages 
            : allPages.filter(page => page.pageType === 'front')
    );
</script>

<div class="pages-container">
    {#if paginatedPages.length > 0}
        {#each paginatedPages as page, pageIndex (pageIndex)}
            <Page layout={layout} pageType={page.pageType}>
                {#each page.cards as card (card.id)}
                    <Card cardId={card.id}>
                        {#if page.pageType === 'front'}
                            <CardFrontContent {card} />
                        {:else}
                            <CardBackContent {card} />
                        {/if}
                    </Card>
                {/each}
            </Page>
        {/each}
    {:else}
    <!-- Empty state -->
    <Page {layout}>
        <div class="empty-state">
            <p>No cards to display</p>
        </div>
        </Page>
    {/if}
</div>
<style>
    .pages-container {
        /* Default: single column layout for narrow screens and print */
        display: flex;
        flex-direction: column;
        gap: 0;
        
        /* Wide screen: responsive flexbox rows */
        /* Only applies to screen viewing, not print */
        @media screen and (min-width: 1200px) {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 20px;
        }
        
        /* Extra wide screens: more pages per row */
        @media screen and (min-width: 1800px) {
            gap: 30px;
        }
    }
    
    /* Ensure pages maintain their aspect ratio and don't flex */
    .pages-container :global(.page) {
        @media screen and (min-width: 1200px) {
            flex: 0 0 auto; /* Don't grow or shrink, stay natural size */
            width: 210mm !important; /* Fixed A4 width - override the 100% */
            height: 297mm !important; /* Fixed A4 height */
            /* This preserves the A4 aspect ratio (1:1.414) */
        }
    }
    
    /* Print mode: override flexbox to ensure proper print layout */
    @media print {
        .pages-container {
            display: block !important;
        }
        
        .pages-container :global(.page) {
            display: block !important;
            width: auto !important;
            height: auto !important;
            min-width: auto !important;
            max-width: auto !important;
        }
    }
    
    .empty-state {
        grid-column: 1 / -1;
        grid-row: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ui-muted, #64748b);
        font-style: italic;
    }
</style>
