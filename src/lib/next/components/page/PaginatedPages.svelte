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
    }
    
    let { cards, layout }: Props = $props();
    
    // Generate paginated pages
    let paginatedPages = $derived(createPaginatedPages(cards, layout));
</script>

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

<style>
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
