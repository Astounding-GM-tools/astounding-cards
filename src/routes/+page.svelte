<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDeck } from '$lib/stores/cards';
  import { updateCharacter, loadDeck, deckFromUrl, addCharacter, saveDeck } from '$lib/stores/cards';
  import type { Character } from '$lib/types';
  import CharacterCardFront from '$lib/components/CharacterCardFront.svelte';
  import CharacterCardBack from '$lib/components/CharacterCardBack.svelte';

  let showCropMarks = true;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      // Try to load deck from URL first
      const urlDeck = deckFromUrl(new URL(window.location.href));
      if (urlDeck) {
        currentDeck.set(urlDeck);
        loading = false;
        return;
      }

      // Then try to load from IndexedDB
      const savedDeck = await loadDeck('default');
      if (savedDeck) {
        currentDeck.set(savedDeck);
        loading = false;
        return;
      }

      // If no deck exists, create a new empty one
      const newDeck = {
        id: 'default',
        meta: {
          name: 'New Deck',
          theme: 'default'
        },
        characters: []
      };
      
      // Save the new deck to IndexedDB, allowing empty deck during initialization
      await saveDeck(newDeck, true);
      currentDeck.set(newDeck);
      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load deck';
      loading = false;
    }
  });

  function handleCharacterUpdate(id: string, updates: Partial<Character>) {
    updateCharacter(id, updates);
  }

  // Function to get the corresponding back position for a card
  function getBackPosition(frontPosition: number, totalCards: number): number {
    // Calculate the number of complete rows and the cards in the last row
    const completeRows = Math.floor((totalCards - 1) / 3);
    const cardsInLastRow = totalCards - (completeRows * 3);
    
    // Get the row and column of the front position
    const row = Math.floor((frontPosition - 1) / 3);
    const col = (frontPosition - 1) % 3;
    
    if (row === completeRows) {
      // Last (incomplete) row - adjust position based on number of cards
      return (row * 3) + (cardsInLastRow - col);
    } else {
      // Complete rows - reverse column position within row
      return (row * 3) + (2 - col) + 1;
    }
  }
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
    {#if ($currentDeck?.characters?.length ?? 0) < 9}
      <button onclick={addCharacter}>Add Character</button>
    {/if}
  </div>

  {#if loading}
    <div class="message">Loading...</div>
  {:else if error}
    <div class="message error">{error}</div>
  {:else if $currentDeck}
    <!-- Front page -->
    <div class="page">
      <div class="card-grid">
        {#each $currentDeck.characters as character (character.id)}
          <CharacterCardFront 
            {character}
            {showCropMarks}
            onChange={(updates) => handleCharacterUpdate(character.id, updates)}
          />
        {/each}
      </div>
    </div>

    <!-- Back page -->
    <div class="page">
      <div class="card-grid">
        {#each $currentDeck.characters as character, index (character.id)}
          <div style:order={getBackPosition(index + 1, $currentDeck.characters.length)}>
            <CharacterCardBack 
              {character}
              {showCropMarks}
              gridPosition={getBackPosition(index + 1, $currentDeck.characters.length)}
              onChange={(updates) => handleCharacterUpdate(character.id, updates)}
            />
          </div>
        {/each}
      </div>
    </div>
  {/if}
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
    grid-auto-rows: 88.9mm;
    gap: 5mm;
    justify-content: center;
    padding-top: 5mm;
  }

  .card-grid > div {
    width: 100%;
    height: 100%;
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

  .message {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
    color: #666;
  }

  .error {
    color: #d00;
  }

  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background: #357abd;
  }
</style>
