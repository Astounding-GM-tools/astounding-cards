<!-- PagedCards.svelte -->
<script lang="ts">
  import type { Card } from '$lib/types';
  import CardFront from '../cards/CardFront.svelte';
  import CardBack from '../cards/CardBack.svelte';
  import { currentDeck } from '$lib/stores/deck';
  import {
    createPaginatedCards,
    type Page
  } from './PagedCards.svelte.ts';
  
  const paginationData = $derived(createPaginatedCards($currentDeck));
  const { pages, cardSize } = $derived(paginationData);
</script>

{#if $currentDeck}
  {#each pages as page (page.index)}
    {#if page.cards.length > 0}
      <!-- Front page -->
      <div class="page" data-size={cardSize}>
        <div class="card-grid">
          {#each page.cards as card (card.id)}
            <div class="card-wrapper">
              <CardFront 
                {card}
                theme={$currentDeck.meta.theme}
              />
            </div>
          {/each}
        </div>
      </div>

      <!-- Back page - immediately after its corresponding front page -->
      <div class="page" data-size={cardSize}>
        <div class="card-grid back-grid">
          {#each page.cards as card (card.id)}
            <div class="card-wrapper">
              <CardBack 
                {card}
                theme={$currentDeck.meta.theme}
                editable={true}
              />
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/each}
{/if}

<style>
  /* A4 page setup for preview */
  .page {
    width: 210mm;  /* A4 preview size */
    height: 297mm;
    margin: 0 auto 20mm;  /* Increased gap between pages */
    padding: var(--page-margin);
    background: var(--page-bg);
    box-shadow: var(--page-shadow);
    position: relative;
    page-break-after: always;
    box-sizing: border-box;
    /* Center grid vertically */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Card grid container */
  .card-grid {
    /* Return to working 5:7 aspect ratio */
    aspect-ratio: 5 / 7;
    width: calc(100% - calc(var(--page-margin) * 2));
    display: grid;
    gap: 0;
    margin: var(--page-margin) 0;  /* Add vertical margin to show crop marks */
  }

  /* Poker size grid (3x3) */
  .page[data-size="poker"] .card-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }

  /* Tarot size grid (2x2) */
  .page[data-size="tarot"] .card-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }

  /* Back page - reverse each row */
  .back-grid {
    direction: rtl;
  }

  /* Card wrapper */
  .card-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    /* Ensure crop marks are visible with proper spacing */
    padding: var(--card-padding);
    box-sizing: border-box;
  }

  /* Reset direction for card content */
  .back-grid .card-wrapper {
    direction: ltr;
  }

  /* Print styles - adapt to any paper size */
  @media print {
    .page {
      width: auto;
      height: auto;
      min-height: 100vh;
      margin: 0;
      padding: var(--page-margin);
      box-shadow: none;
      page-break-after: always;
      page-break-inside: avoid;
    }

    /* Ensure each page starts on a new sheet */
    @page {
      margin: 0;
      size: auto;
    }
  }
</style> 