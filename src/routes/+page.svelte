<script lang="ts">
  import { darkVeinsDeck } from '$lib/mock/dark-veins';
  import CharacterCardFront from '$lib/components/CharacterCardFront.svelte';
  import CharacterCardBack from '$lib/components/CharacterCardBack.svelte';
  
  let showCropMarks = true;

  // Function to get the corresponding back position for a card
  function getBackPosition(frontPosition: number): number {
    // When flipping on long edge, columns reverse but rows stay the same
    // Example: 1->3, 2->2, 3->1, 4->6, 5->5, 6->4, 7->9, 8->8, 9->7
    const row = Math.floor((frontPosition - 1) / 3); // 0-based row number
    const col = (frontPosition - 1) % 3; // 0-based column number
    return row * 3 + (2 - col) + 1; // Reverse column position within same row
  }

  const { characters } = darkVeinsDeck;
</script>

<div class="print-container">
  <!-- Print settings -->
  <div class="settings no-print">
    <label>
      <input type="checkbox" bind:checked={showCropMarks}>
      Show crop marks
    </label>
    <div class="print-info">
      Print double-sided, flip on long edge (like a book)
    </div>
  </div>

  <!-- Front page -->
  <div class="page">
    <div class="card-grid">
      {#each characters as character}
        <CharacterCardFront 
          {character}
          {showCropMarks}
        />
      {/each}
    </div>
  </div>

  <!-- Back page -->
  <div class="page">
    <div class="card-grid">
      {#each characters as character, i}
        <CharacterCardBack 
          {character}
          gridPosition={getBackPosition(i + 1)}
          {showCropMarks}
        />
      {/each}
    </div>
  </div>
</div>

<style>
  /* Print settings */
  .settings {
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f0f0f0;
    border-radius: 4px;
  }

  .print-info {
    margin-top: 0.5rem;
    font-style: italic;
    color: #666;
  }

  /* A4 page setup */
  .page {
    width: 210mm;
    height: 297mm;
    padding: 8mm;
    margin: 0 auto 2rem;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    position: relative;
  }

  /* Card grid */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, 63.5mm);
    grid-template-rows: repeat(3, 88.9mm);
    gap: 5mm;
    justify-content: center;
    padding-top: 5mm;
  }

  /* Print styles */
  @media print {
    .no-print {
      display: none;
    }

    .print-container {
      margin: 0;
      padding: 0;
    }

    .page {
      margin: 0;
      box-shadow: none;
      page-break-after: always;
    }

    /* Ensure clean page breaks */
    @page {
      size: A4;
      margin: 0;
    }
  }
</style>
