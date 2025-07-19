<!-- PagedCards.svelte -->
<script lang="ts">
  import type { Character } from '$lib/types';
  import CharacterCardFront from './CharacterCardFront.svelte';
  import CharacterCardBack from './CharacterCardBack.svelte';

  export let characters: Character[];
  export let showCropMarks: boolean;
  export let onCharacterChange: (id: string, updates: Partial<Character>) => void;

  // Calculate how many full pages of 9 cards we need
  $: totalPages = Math.ceil(characters.length / 9);
  
  // Get characters for a specific page (0-based index)
  function getPageCharacters(pageIndex: number): Character[] {
    const start = pageIndex * 9;
    return characters.slice(start, start + 9);
  }
</script>

{#each Array(totalPages) as _, pageIndex}
  <!-- Front page -->
  <div class="page">
    <div class="card-grid">
      {#each getPageCharacters(pageIndex) as character (character.id)}
        <div>
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
  <div class="page">
    <div class="card-grid back-grid">
      {#each getPageCharacters(pageIndex) as character (character.id)}
        <div>
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
  /* A4 page setup */
  .page {
    width: 210mm;
    height: 297mm;
    margin: 0 auto 2rem;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    position: relative;
    page-break-after: always;
  }

  /* Card grid */
  .card-grid {
    display: grid;
    /* Full width divided by 3 */
    grid-template-columns: repeat(3, calc(210mm / 3));
    /* Full height divided by 3 */
    grid-auto-rows: calc(297mm / 3);
  }

  /* Back page - reverse each row */
  .back-grid {
    direction: rtl;
  }

  /* Reset direction for card content */
  .back-grid > div {
    direction: ltr;
  }

  /* Hide crop marks for middle column */
  .card-grid > div:nth-child(3n-1) :global(.show-crop-marks::before),
  .card-grid > div:nth-child(3n-1) :global(.show-crop-marks::after) {
    border-left-color: transparent;
    border-right-color: transparent;
  }

  /* Hide crop marks for middle row */
  .card-grid > div:nth-child(n+4):nth-child(-n+6) :global(.show-crop-marks::before),
  .card-grid > div:nth-child(n+4):nth-child(-n+6) :global(.show-crop-marks::after) {
    border-top-color: transparent;
    border-bottom-color: transparent;
  }

  /* Print styles */
  @media print {
    .page {
      margin: 0;
      box-shadow: none;
    }
  }
</style> 