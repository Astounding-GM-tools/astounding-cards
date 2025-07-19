<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDeck } from '$lib/stores/cards';
  import { updateCharacter, loadDeck, deckFromUrl, addCharacter, saveDeck } from '$lib/stores/cards';
  import type { Character } from '$lib/types';
  import CharacterCardFront from '$lib/components/CharacterCardFront.svelte';
  import CharacterCardBack from '$lib/components/CharacterCardBack.svelte';
  import UrlSizeIndicator from '$lib/components/UrlSizeIndicator.svelte';
  import DeckSelector from '$lib/components/DeckSelector.svelte';
  import DeckList from '$lib/components/DeckList.svelte';
  import Toasts from '$lib/components/Toasts.svelte';
  import { toasts } from '$lib/stores/toast';
  import { deckToUrl } from '$lib/stores/cards';

  let showCropMarks = true;
  let loading = true;
  let error: string | null = null;
  let deckDialog: HTMLDialogElement;

  async function copyShareUrl() {
    if (!$currentDeck) return;
    
    try {
      const shareUrl = deckToUrl($currentDeck);
      await navigator.clipboard.writeText(shareUrl);
      toasts.success('Share URL copied! Send this URL to share your deck.');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      toasts.error('Failed to copy URL to clipboard');
    }
  }

  onMount(async () => {
    try {
      // Try to load deck from URL first
      const urlDeck = deckFromUrl(new URL(window.location.href));
      if (urlDeck) {
        currentDeck.set(urlDeck);
        // Clear the URL without triggering navigation
        history.replaceState(null, '', window.location.pathname);
        toasts.info('Deck loaded from URL. The URL has been cleared to prevent overwriting your changes.');
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
          theme: 'default',
          lastEdited: Date.now(),
          createdAt: Date.now()
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

  // Subscribe to deck changes to show URL reset notification
  $: if ($currentDeck) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('deck')) {
      history.replaceState(null, '', window.location.pathname);
      toasts.info('URL was reset. Create a new share URL to share your changes.');
    }
  }

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
  <Toasts />
  <!-- Print settings -->
  <div class="settings no-print">
    <div class="settings-row">
      <button 
        class="action-button"
        onclick={() => deckDialog.showModal()}
      >
        📚 Manage Decks
      </button>
      <button 
        class="action-button"
        onclick={copyShareUrl}
        disabled={!$currentDeck}
      >
        🔗 Copy Share URL
      </button>
      {#if $currentDeck}
        <button 
          class="action-button"
          onclick={addCharacter}
        >
          ➕ Add Character
        </button>
      {/if}
      <div class="right-controls">
        <label class="crop-marks">
          <input type="checkbox" bind:checked={showCropMarks}>
          Show crop marks
        </label>
        {#if $currentDeck}
          <div class="url-size">
            <UrlSizeIndicator deck={$currentDeck} />
          </div>
        {/if}
      </div>
    </div>
  </div>

  <dialog 
    bind:this={deckDialog}
    class="deck-dialog"
  >
    <div class="dialog-header">
      <h2>📚 Deck Management</h2>
      <button 
        class="close-button"
        onclick={() => deckDialog.close()}
      >
        ×
      </button>
    </div>
    <div class="dialog-content">
      <DeckSelector />
      <DeckList />
    </div>
  </dialog>

  {#if loading}
    <div class="message">Loading...</div>
  {:else if error}
    <div class="message error">{error}</div>
  {:else if $currentDeck}
    <!-- Front page -->
    <div class="page">
      <div class="card-grid">
        {#each $currentDeck.characters as character (character.id)}
          <div>
            <CharacterCardFront 
              {character}
              {showCropMarks}
              onChange={(updates) => handleCharacterUpdate(character.id, updates)}
            />
          </div>
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
    padding: 1rem;
    border-bottom: 1px solid #ddd;
  }

  .settings-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .right-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;
  }

  .action-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 36px;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  /* Manage Decks - Blue */
  .action-button:nth-child(1) {
    background: #e3f2fd;
    border-color: #90caf9;
    color: #1976d2;
  }
  .action-button:nth-child(1):hover {
    background: #bbdefb;
  }

  /* Share URL - Green */
  .action-button:nth-child(2) {
    background: #e8f5e9;
    border-color: #a5d6a7;
    color: #2e7d32;
  }
  .action-button:nth-child(2):hover {
    background: #c8e6c9;
  }
  .action-button:nth-child(2):disabled {
    background: #f5f5f5;
    border-color: #ddd;
    color: #999;
    cursor: not-allowed;
  }

  /* Add Character - Purple */
  .action-button:nth-child(3) {
    background: #f3e5f5;
    border-color: #ce93d8;
    color: #7b1fa2;
  }
  .action-button:nth-child(3):hover {
    background: #e1bee7;
  }

  .crop-marks {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }

  .crop-marks input[type="checkbox"] {
    margin: 0;
  }

  .url-size {
    font-size: 0.9rem;
    color: #666;
  }

  /* Remove unused styles */
  .url-info, .print-info {
    display: none;
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

  .deck-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
  }

  .settings-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  /* Hide deck management in print mode */
  @media print {
    .no-print {
      display: none;
    }
  }

  .deck-management {
    position: relative;
  }

  .deck-management summary {
    cursor: pointer;
    padding: 0.5rem 1rem;
    background: #f5f5f5;
    border-radius: 4px;
    user-select: none;
  }

  .deck-management summary:hover {
    background: #e8e8e8;
  }

  .management-content {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.5rem;
    background: white;
    border: 1px solid #eee;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 100;
    min-width: 300px;
    max-height: 80vh;
    overflow-y: auto;
  }

  @media print {
    .no-print {
      display: none;
    }
  }

  .deck-button {
    padding: 0.5rem 1rem;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .deck-button:hover {
    background: #357abd;
  }

  .deck-dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    max-width: 90vw;
    max-height: 90vh;
    width: 600px;
  }

  .deck-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #eee;
    border-radius: 8px 8px 0 0;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #666;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .close-button:hover {
    background: #e8e8e8;
    color: #333;
  }

  .dialog-content {
    padding: 1rem;
    overflow-y: auto;
    max-height: calc(90vh - 4rem);
  }

  @media print {
    .no-print {
      display: none;
    }
  }

  .test-toast {
    padding: 0.25rem 0.75rem;
    font-size: 0.9rem;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }

  .test-toast:hover {
    background: #e0e0e0;
  }

  .share-button {
    padding: 0.25rem 0.75rem;
    font-size: 0.9rem;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .share-button:hover {
    background: #43a047;
  }

  .share-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
</style>
