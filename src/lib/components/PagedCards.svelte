<!-- PagedCards.svelte -->
<script lang="ts">
  import type { Character, CardSize } from '$lib/types';
  import CharacterCardFront from './CharacterCardFront.svelte';
  import CharacterCardBack from './CharacterCardBack.svelte';
  import { currentDeck } from '$lib/stores/cards';

  export let showCropMarks: boolean;
  export let onCharacterChange: (id: string, updates: Partial<Character>) => Promise<void>;

  $: cardSize = $currentDeck?.meta.cardSize || 'poker';
  $: cardsPerPage = cardSize === 'poker' ? 9 : 4;
  
  // Calculate how many full pages we need
  $: totalPages = Math.ceil($currentDeck?.characters.length || 0 / cardsPerPage);
  
  // Get characters for a specific page (0-based index)
  function getPageCharacters(pageIndex: number): Character[] {
    const start = pageIndex * cardsPerPage;
    return $currentDeck?.characters.slice(start, start + cardsPerPage) || [];
  }

  // Create reactive references for each page's characters
  $: pages = Array(totalPages).fill(null)
    .map((_, i) => ({
      index: i,
      characters: getPageCharacters(i)
    }))
    .filter(page => page.characters.length > 0);
</script>

{#each pages as page (page.index)}
  <!-- Front page -->
  <div class="page" data-size={cardSize}>
    <div class="card-grid">
      {#each page.characters as character (character.id)}
        <div class="card-wrapper">
          <CharacterCardFront 
            {character}
            {showCropMarks}
            onChange={(updates: Partial<Character>) => onCharacterChange(character.id, updates)}
          />
        </div>
      {/each}
    </div>
  </div>

  <!-- Back page -->
  <div class="page" data-size={cardSize}>
    <div class="card-grid back-grid">
      {#each page.characters as character (character.id)}
        <div class="card-wrapper">
          <CharacterCardBack 
            {character}
            {showCropMarks}
            onChange={(updates: Partial<Character>) => onCharacterChange(character.id, updates)}
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