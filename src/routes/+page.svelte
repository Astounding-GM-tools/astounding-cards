<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDeck } from '$lib/stores/cards';
  import { updateCharacter, loadDeck, deckFromUrl, addCharacter, saveDeck, listDecks, setCurrentDeck } from '$lib/stores/cards';
  import type { Character } from '$lib/types';
  import CharacterCardFront from '$lib/components/CharacterCardFront.svelte';
  import CharacterCardBack from '$lib/components/CharacterCardBack.svelte';
  import UrlSizeIndicator from '$lib/components/UrlSizeIndicator.svelte';
  import DeckSelector from '$lib/components/DeckSelector.svelte';
  import DeckList from '$lib/components/DeckList.svelte';
  import Toasts from '$lib/components/Toasts.svelte';
  import { toasts } from '$lib/stores/toast';
  import { deckToUrl } from '$lib/stores/cards';
  import PagedCards from '$lib/components/PagedCards.svelte';
  import PrintInstructions from '$lib/components/PrintInstructions.svelte';

  let showCropMarks = true;
  let loading = true;  // Start with loading true
  let error: string | null = null;
  let deckDialog: HTMLDialogElement;
  let printDialog: HTMLDialogElement;

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

  // Load initial deck
  $: {
    if (!$currentDeck) {  // Remove loading check to ensure initial load
      (async () => {
        try {
          // Try to load deck from URL first
          const urlDeck = deckFromUrl(new URL(window.location.href));
          if (urlDeck) {
            await saveDeck(urlDeck);
            setCurrentDeck(urlDeck);
            // Clear the URL without triggering navigation
            history.replaceState(null, '', window.location.pathname);
            toasts.info('Deck loaded from URL. The URL has been cleared to prevent overwriting your changes.');
            loading = false;
            return;
          }

          // Get all decks and find the most recently edited one
          const decks = await listDecks();
          if (decks.length > 0) {
            // Sort by lastEdited timestamp (newest first)
            const sortedDecks = decks.sort((a, b) => b.meta.lastEdited - a.meta.lastEdited);
            const mostRecentDeck = sortedDecks[0];
            
            // Load the most recent deck
            const loadedDeck = await loadDeck(mostRecentDeck.id);
            if (loadedDeck) {
              setCurrentDeck(loadedDeck);
              loading = false;
              return;
            }
          }

          // If no decks exist, create a new empty one
          const newDeck = {
            id: crypto.randomUUID(),
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
          setCurrentDeck(newDeck);
          loading = false;
        } catch (e) {
          error = e instanceof Error ? e.message : 'Failed to load deck';
          loading = false;
        }
      })();
    }
  }

  // Subscribe to deck changes to show URL reset notification
  $: if ($currentDeck) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('deck')) {
      history.replaceState(null, '', window.location.pathname);
      toasts.info('URL was reset. Create a new share URL to share your changes.');
    }
  }

  async function handleCharacterUpdate(id: string, updates: Partial<Character>) {
    await updateCharacter(id, updates);
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

<!-- Root container -->
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
        <button 
          class="action-button info"
          onclick={() => printDialog.showModal()}
        >
          🖨️ Print Instructions
        </button>
        {#if $currentDeck}
          <div class="url-size">
            <UrlSizeIndicator deck={$currentDeck} />
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Deck management dialog -->
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

  <PrintInstructions bind:dialog={printDialog} />

  <!-- Main content -->
  <div class="cards-scroll-container">
    {#if !$currentDeck}
      <div class="message">Loading...</div>
    {:else if $currentDeck.characters.length === 0}
      <div class="message">No characters in deck</div>
    {:else if $currentDeck}
      <PagedCards 
        {showCropMarks}
        onCharacterChange={handleCharacterUpdate}
      />
    {/if}
  </div>
</div>

  <style>
    /* A4 page setup */
    .page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto 2rem;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      position: relative;
    }

    /* Card grid */
    .card-grid {
      display: grid;
      /* Full width divided by 3 */
      grid-template-columns: repeat(3, calc(210mm / 3));
      /* Full height divided by 3 */
      grid-auto-rows: calc(297mm / 3);
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

    /* Loading and error messages */
    .message {
      text-align: center;
      padding: 2rem;
      font-size: 1.2rem;
      color: #666;
    }

    .error {
      color: #d00;
    }

    /* Settings section */
    .settings {
      padding: 1rem;
      border-bottom: 1px solid #ddd;
      margin-bottom: 1rem;
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

    /* Action buttons */
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

    /* Crop marks checkbox */
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

    /* URL size indicator */
    .url-size {
      font-size: 0.9rem;
      color: #666;
    }

    /* Remove unused styles */
    .url-info, .print-info {
      display: none;
    }

    /* Dialog styles */
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

    /* Print container */
    .print-container {
      margin: 0;
      padding: 0;
    }

    .print-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .cards-scroll-container {
      flex: 1;
      overflow-y: auto;
      position: relative;
    }

    /* Print styles */
    @media print {
      .no-print {
        display: none;
      }

      .page {
        margin: 0;  /* Remove margins when printing */
        box-shadow: none;
        page-break-after: always;
      }

      @page {
        size: A4;
        margin: 0;
      }
    }

    /* Info button - Blue */
    .action-button.info {
      background: #e3f2fd;
      border-color: #90caf9;
      color: #1976d2;
    }
    .action-button.info:hover {
      background: #bbdefb;
    }
  </style>
