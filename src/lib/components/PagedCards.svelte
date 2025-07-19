<!-- PagedCards.svelte -->
<script lang="ts">
  import type { Character } from '$lib/types';
  import CharacterCardFront from './CharacterCardFront.svelte';
  import CharacterCardBack from './CharacterCardBack.svelte';
  import { currentDeck } from '$lib/stores/cards';

  export let showCropMarks: boolean;
  export let onCharacterChange: (id: string, updates: Partial<Character>) => Promise<void>;

  // Calculate how many full pages of 9 cards we need
  $: totalPages = Math.ceil($currentDeck?.characters.length || 0 / 9);
  
  // Get characters for a specific page (0-based index)
  function getPageCharacters(pageIndex: number): Character[] {
    const start = pageIndex * 9;
    return $currentDeck?.characters.slice(start, start + 9) || [];
  }

  // Create reactive references for each page's characters
  $: pages = Array(totalPages).fill(null)
    .map((_, i) => ({
      index: i,
      characters: getPageCharacters(i)
    }))
    .filter(page => page.characters.length > 0);  // Only keep pages with characters

  // Calculate back card position
  function getBackPosition(frontPosition: number): number {
    const row = Math.floor((frontPosition - 1) / 3);
    const col = (frontPosition - 1) % 3;
    return (row * 3) + (2 - col) + 1;
  }
</script>

{#each pages as page (page.index)}
  <!-- Front page -->
  <div class="page">
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
  <div class="page">
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

  /* Print styles */
  @media print {
    .page {
      margin: 0;
      box-shadow: none;
    }
  }
</style> 