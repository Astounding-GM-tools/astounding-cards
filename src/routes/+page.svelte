<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { currentDeck, currentDeckId, deckFromUrl, addCard, deckToUrl } from '$lib/stores/deck';
  import { getDeck, getAllDecks } from '$lib/db';
  import type { Card } from '$lib/types';
  import CardFront from '$lib/components/cards/CardFront.svelte';
  import CardBack from '$lib/components/cards/CardBack.svelte';
  import DeckSelector from '$lib/components/deck/DeckSelector.svelte';
  import DeckList from '$lib/components/deck/DeckList.svelte';
  import Toasts from '$lib/components/ui/Toasts.svelte';
  import { toasts } from '$lib/stores/toast';
  import PagedCards from '$lib/components/ui/PagedCards.svelte';
  import PrintInstructions from '$lib/components/ui/PrintInstructions.svelte';
  import { devMode } from '$lib/stores/dev';
  import ShareDialog from '$lib/components/dialogs/ShareDialog.svelte';

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
  let deckListRef: any;

  function handleDeckChange(event: CustomEvent<{ action: string, deckId: string }>) {
    // Forward the event to DeckList if it exists
    if (deckListRef && deckListRef.handleDeckChange) {
      deckListRef.handleDeckChange(event);
    }
  }

  // Store scroll position before update
  let lastScrollPosition = 0;

  // Restore scroll position after update
  $effect(() => {
    if ($currentDeck && scrollContainer && lastScrollPosition > 0) {
      scrollContainer.scrollTop = lastScrollPosition;
      untrack(() => {
        lastScrollPosition = 0;
      });
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
  // Use non-reactive variables to track loading state to avoid circular dependencies
  let loadingDeckId: string | null = null;
  let currentLoadedDeckId: string | null = null;
  
  $effect(() => {
    const id = $currentDeckId;
    
    // Prevent infinite loops by tracking what we're loading and what's loaded using non-reactive variables
    if (id && id !== loadingDeckId && id !== currentLoadedDeckId) {
      loadingDeckId = id;
      
      getDeck(id).then(deck => {
        // Only update if this is still the deck we want to load
        if (untrack(() => $currentDeckId) === id) {
          if (deck) {
            // Use untrack to prevent reactive loops when setting the deck
            untrack(() => {
              currentDeck.set(deck);
            });
            currentLoadedDeckId = id;
          } else {
            // Deck not found, clear the ID
            untrack(() => {
              currentDeck.set(null);
            });
            currentLoadedDeckId = null;
            toasts.error('Deck not found');
          }
        }
        loadingDeckId = null;
      }).catch(err => {
        console.error('Error loading deck:', err);
        if (untrack(() => $currentDeckId) === id) {
          untrack(() => {
            currentDeck.set(null);
          });
          currentLoadedDeckId = null;
          toasts.error('Failed to load deck: ' + err.message);
        }
        loadingDeckId = null;
      });
    } else if (!id) {
      untrack(() => {
        currentDeck.set(null);
      });
      currentLoadedDeckId = null;
      loadingDeckId = null;
    }
  });
  
  onMount(() => {
    // Check for URL deck data first
    const url = new URL(window.location.href);
    const urlDeck = deckFromUrl(url);
    
    if (urlDeck) {
      // Load deck from URL directly - use untrack to prevent reactive loops
      untrack(() => {
        loading = true;
        currentDeck.set(urlDeck);
        currentDeckId.set(urlDeck.id);
        loading = false;
      });
      return;
    }
    
    // Otherwise, load from database as usual - wrap in untrack to prevent reactive issues
    untrack(() => {
      loading = true;
    });
    
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
        untrack(() => {
          error = err instanceof Error ? err.message : String(err);
        });
      })
      .finally(() => {
        untrack(() => {
          loading = false;
        });
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
        data-testid="manage-decks-button"
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
      <DeckSelector on:deckchange={handleDeckChange} />
      <DeckList bind:this={deckListRef} />
    </div>
  </dialog>

  <PrintInstructions dialog={printDialog} />

  <!-- Main content -->
   <h1>{$currentDeck?.meta.name || "Astounding Game Cards" }</h1>
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

  /* Page-specific overrides for action buttons */
  .right-controls {
    margin-left: auto;
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
