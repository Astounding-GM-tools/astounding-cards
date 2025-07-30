<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDeck, currentDeckId, deckFromUrl, addCard, deckToUrl } from '$lib/stores/deck';
  import { getDeck, getAllDecks } from '$lib/db';
  import type { Card } from '$lib/types';
  import CardFront from '$lib/components/CardFront.svelte';
  import CardBack from '$lib/components/CardBack.svelte';
  import DeckSelector from '$lib/components/DeckSelector.svelte';
  import DeckList from '$lib/components/DeckList.svelte';
  import Toasts from '$lib/components/Toasts.svelte';
  import { toasts } from '$lib/stores/toast';
  import PagedCards from '$lib/components/PagedCards.svelte';
  import PrintInstructions from '$lib/components/PrintInstructions.svelte';
  import { devMode } from '$lib/stores/dev';
  import ShareDialog from '$lib/components/ShareDialog.svelte';
  import { createDeckContext } from '$lib/stores/deckContext';
  
  // Create deck context
  createDeckContext();

  // State
  let showPrintInstructions = $state(false);
  let showShareDialog = $state(false);
  let showImageMigrationDialog = $state(false);

  let loading = $state(true);  // Start with loading true
  let error = $state<string | null>(null);
  let deckDialog = $state<HTMLDialogElement | null>(null) as unknown as HTMLDialogElement;
  let printDialog = $state<HTMLDialogElement | null>(null) as unknown as HTMLDialogElement;
  let scrollContainer = $state<HTMLElement | null>(null);
  let shareDialog = $state(false);

  // Store scroll position before update
  let lastScrollPosition = 0;

  // Restore scroll position after update
  $effect(() => {
    if ($currentDeck && scrollContainer && lastScrollPosition > 0) {
      scrollContainer.scrollTop = lastScrollPosition;
      lastScrollPosition = 0;
    }
  });

  // Subscribe to deck changes to show URL reset notification
  $effect(() => {
    if ($currentDeck) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('deck')) {
        history.replaceState(null, '', window.location.pathname);
        toasts.info('URL was reset. Create a new share URL to share your changes.');
      }
    }
  });

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

  // Load deck when currentDeckId changes
  let loadingDeckId = $state<string | null>(null);
  
  $effect(() => {
    const id = $currentDeckId;
    
    // Prevent infinite loops by tracking what we're loading
    if (id && id !== loadingDeckId) {
      loadingDeckId = id;
      
      getDeck(id).then(deck => {
        // Only update if this is still the deck we want to load
        if ($currentDeckId === id) {
          if (deck) {
            currentDeck.set(deck);
          } else {
            // Deck not found, clear the ID
            currentDeck.set(null);
            toasts.error('Deck not found');
          }
        }
        loadingDeckId = null;
      }).catch(err => {
        console.error('Error loading deck:', err);
        if ($currentDeckId === id) {
          currentDeck.set(null);
          toasts.error('Failed to load deck: ' + err.message);
        }
        loadingDeckId = null;
      });
    } else if (!id) {
      currentDeck.set(null);
      loadingDeckId = null;
    }
  });
  
  onMount(() => {
      loading = true;
      getAllDecks()
        .then(allDecks => {
          if (allDecks.length > 0) {
            // Sort by lastEdited and get most recent
            const sortedDecks = allDecks.sort((a, b) => b.meta.lastEdited - a.meta.lastEdited);
            const mostRecent = sortedDecks[0];
            currentDeckId.set(mostRecent.id);
          } else {
            currentDeckId.set(null);
          }
        })
        .catch(err => {
          error = err instanceof Error ? err.message : String(err);
        })
        .finally(() => {
          loading = false;
        });
  });

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
<div class="print-container" class:dev-mode={$devMode}>
  <Toasts />
  
  <!-- Print settings -->
  <div class="settings no-print">
    <div class="settings-row">
      <button 
        class="action-button"
        onclick={() => deckDialog?.showModal()}
      >
        📚 Manage Decks
      </button>
      {#if $currentDeck}
        <button 
          class="action-button"
          onclick={() => shareDialog = true}
        >
          🔗 Share Deck
        </button>
        <button 
          class="action-button"
          onclick={addCard}
        >
          ➕ Add Card
        </button>
        <div class="right-controls">
          <button 
            class="action-button info"
            onclick={() => printDialog?.showModal()}
          >
            🖨️ Print Instructions
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if shareDialog && $currentDeck}
    <ShareDialog 
      deck={$currentDeck}
      onClose={() => shareDialog = false}
      onUpdate={() => {}}
    />
  {/if}

  <!-- Deck management dialog -->
  <dialog 
    bind:this={deckDialog as HTMLDialogElement}
    class="deck-dialog"
  >
    <div class="dialog-header">
      <h2>📚 Deck Management</h2>
      <button 
        class="close-button"
        onclick={() => deckDialog?.close()}
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
  <div class="cards-scroll-container" bind:this={scrollContainer}>
    {#if loading}
      <div class="message">Loading...</div>
    {:else if error}
      <div class="message error">{error}</div>
    {:else if !$currentDeck}
      <div class="message">No decks found. Click "Manage Decks" to create your first deck.</div>
    {:else if $currentDeck.cards.length === 0}
      <div class="message">No cards in deck</div>
    {:else}
      <PagedCards />
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
    font-size: var(--ui-title-size);
    font-family: var(--ui-font-family);
    color: var(--ui-text);
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
