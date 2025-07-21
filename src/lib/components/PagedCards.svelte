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
  $: gridColumns = cardSize === 'poker' ? 3 : 2;
  
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

  // Calculate back card position
  function getBackPosition(frontPosition: number): number {
    const cols = cardSize === 'poker' ? 3 : 2;
    const row = Math.floor((frontPosition - 1) / cols);
    const col = (frontPosition - 1) % cols;
    return (row * cols) + (cols - 1 - col) + 1;
  }
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
            onChange={(updates) => onCharacterChange(character.id, updates)}
          />
        </div>
      {/each}
    </div>
  </div>

  <!-- Back page -->
  <div class="page" data-size={cardSize}>
    <div class="card-grid back-grid">
      {#each page.characters as character, index (character.id)}
        <div class="card-wrapper" style:order={getBackPosition(index + 1)}>
          <CharacterCardBack 
            {character}
            {showCropMarks}
            onChange={(updates) => onCharacterChange(character.id, updates)}
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
    margin: 0 auto 2rem;
    padding: 4mm;  /* Safe margin for printers */
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
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
    /* Match card proportions: width is 3 units × 5, height is 3 units × 7 */
    aspect-ratio: 15 / 21;
    /* Take up available width minus padding */
    width: calc(100% - 8mm);
    /* Grid setup */
    display: grid;
    gap: 0;
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
      min-height: 100vh;  /* Use full page height */
      margin: 0;
      padding: 4mm;  /* Keep safe margin for all printers */
      box-shadow: none;
      page-break-after: always;
    }

    /* Ensure each page starts on a new sheet */
    @page {
      margin: 0;
      size: auto;  /* Use printer's default paper size */
    }

    /* Adjust for US Letter (shorter height) */
    @media (max-height: 280mm) {  /* Letter paper height */
      .card-grid {
        /* Slightly reduce height while maintaining readable proportions */
        aspect-ratio: 15 / 20;  /* Slightly less tall than A4 ratio */
      }
    }

    /* Extra space for Legal paper */
    @media (min-height: 355mm) {  /* Legal paper height */
      .card-grid {
        /* Keep A4 proportions but scale to Letter width */
        width: calc(215.9mm - 8mm);  /* Letter/Legal width minus padding */
      }
    }
  }
</style> 