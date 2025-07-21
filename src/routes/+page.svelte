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
  onMount(async () => {
    try {
      // Check URL parameters first
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('deck')) {
        const deckParam = urlParams.get('deck')!;
        const url = new URL(window.location.href);
        url.searchParams.set('deck', deckParam);
        const deck = await deckFromUrl(url);
        if (deck) {
          await setCurrentDeck(deck);
          loading = false;
          return;
        }
      }
      
      // No URL deck, load most recent
      const decks = await listDecks();
      if (decks.length > 0) {
        // Sort by last edited and load most recent
        const mostRecent = decks.sort((a, b) => b.meta.lastEdited - a.meta.lastEdited)[0];
        await loadDeck(mostRecent.id);
        await setCurrentDeck(mostRecent);
      }
      loading = false;
    } catch (e) {
      console.error('Failed to load deck:', e);
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
    {#if loading}
      <div class="message">Loading...</div>
    {:else if error}
      <div class="message error">{error}</div>
    {:else if !$currentDeck}
      <div class="message">No decks found. Click "Manage Decks" to create your first deck.</div>
    {:else if $currentDeck.characters.length === 0}
      <div class="message">No characters in deck</div>
    {:else}
      <PagedCards 
        {showCropMarks}
        onCharacterChange={handleCharacterUpdate}
      />
    {/if}
  </div>
</div>

<style>
  /* Print container */
  .print-container {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--ui-bg);
    color: var(--ui-text);
  }

  .cards-scroll-container {
    flex: 1;
    overflow-y: auto;
    position: relative;
  }

  /* Settings section */
  .settings {
    padding: var(--content-gap);
    border-bottom: 1px solid var(--ui-border);
    margin-bottom: var(--content-gap);
    background: var(--ui-bg);
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
    font-size: var(--ui-font-size);
    border: 1px solid var(--button-border);
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 36px;
    white-space: nowrap;
    transition: all 0.2s ease;
    background: var(--button-bg);
    color: var(--button-text);
  }

  .action-button:hover {
    background: var(--button-hover-bg);
  }

  .action-button:active {
    background: var(--button-active-bg);
  }

  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Info button - Blue */
  .action-button.info {
    background: var(--toast-info);
    border-color: var(--toast-info);
    color: white;
  }

  .action-button.info:hover {
    opacity: 0.9;
  }

  /* Dialog styling */
  .deck-dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    background: var(--ui-bg);
    color: var(--ui-text);
    box-shadow: var(--page-shadow);
    max-width: 90vw;
    max-height: 90vh;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--content-gap);
    border-bottom: 1px solid var(--ui-border);
  }

  .dialog-header h2 {
    margin: 0;
    font-size: var(--title-font-size);
  }

  .close-button {
    border: none;
    background: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ui-text);
  }

  .close-button:hover {
    background: var(--ui-hover-bg);
  }

  .dialog-content {
    padding: var(--content-gap);
    overflow-y: auto;
    max-height: calc(90vh - 4rem);
  }

  /* Loading and error messages */
  .message {
    text-align: center;
    padding: 2rem;
    font-size: var(--role-font-size);
    color: var(--ui-muted);
  }

  /* Error message */
  .message.error {
    color: var(--toast-error);
  }

  /* Checkbox styling */
  .crop-marks {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--ui-font-size);
    color: var(--ui-text);
  }

  .crop-marks input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    margin: 0;
  }

  /* Print styles */
  @media print {
    .no-print {
      display: none;
    }

    .print-container {
      background: none;
    }
  }
</style>
