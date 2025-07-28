<!-- PagedCards.svelte -->
<script lang="ts">
  import type { Card } from '$lib/types';
  import CardFront from './CardFront.svelte';
  import CardBack from './CardBack.svelte';
  import { currentDeck } from '$lib/stores/deck';

  const { showCropMarks, onCardChange } = $props<{
    showCropMarks: boolean;
    onCardChange: (id: string, updates: Partial<Card>) => Promise<void>;
  }>();

  // Use $derived for pure computations
  const cardSize = $derived($currentDeck?.meta.cardSize || 'poker');
  const cardsPerPage = $derived(cardSize === 'poker' ? 9 : 4);

  // Create pages array using $derived
  const pages = $derived(
    Array(Math.ceil(($currentDeck?.cards.length || 0) / cardsPerPage))
      .fill(null)
      .map((_, i) => {
        const start = i * cardsPerPage;
        return $currentDeck?.cards.slice(start, start + cardsPerPage) || [];
      })
      .filter(page => page.length > 0)
  );
</script>

<!-- Front pages -->
{#each pages as page}
  <div class="page" data-size={cardSize}>
    <div class="card-grid">
      {#each page as card (card.id)}
        <div class="card-wrapper">
          <CardFront 
            card={card}
            {showCropMarks}
            onChange={(updates: Partial<Card>) => onCardChange(card.id, updates)}
            theme={$currentDeck?.meta.theme}
          />
        </div>
      {/each}
    </div>
  </div>
{/each}

<!-- Back pages -->
{#each pages as page}
  <div class="page" data-size={cardSize}>
    <div class="card-grid back-grid">
      {#each page as card (card.id)}
        <div class="card-wrapper">
          <CardBack 
            card={card}
            {showCropMarks}
            onChange={(updates: Partial<Card>) => onCardChange(card.id, updates)}
            theme={$currentDeck?.meta.theme}
            editable={true}
          />
        </div>
      {/each}
    </div>
  </div>
{/each}

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
    /* Ensure crop marks are visible */
    margin: -1px;  /* Prevent gaps between cards */
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