<script lang="ts">
  import { onMount } from 'svelte';
  import { listDecks } from '$lib/stores/deck';
  import type { Deck } from '$lib/types';
  import DeckManager from './DeckManager.svelte';

  let decks = $state<Deck[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function loadDecks() {
    try {
      decks = await listDecks();
      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load decks';
      loading = false;
    }
  }

  $effect(() => {
    loadDecks();
  });

  async function handleDeckChange(event: CustomEvent<{ action: string, deckId: string }>) {
    if (event.detail.action === 'delete') {
      // Remove the deck from the list immediately
      decks = decks.filter(d => d.id !== event.detail.deckId);
    } else {
      // For other actions, reload the list
      await loadDecks();
    }
  }

  const sortedDecks = $derived([...decks].sort((a, b) => b.meta.lastEdited - a.meta.lastEdited));
</script>

<div class="deck-list">
  {#if loading}
    <div class="message">Loading decks...</div>
  {:else if error}
    <div class="message error">{error}</div>
  {:else if decks.length === 0}
    <div class="message">No decks found. Create your first deck using the selector above.</div>
  {:else}
    <div class="decks">
      {#each sortedDecks as deck (deck.id)}
        <DeckManager {deck} ondeckchange={handleDeckChange} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .deck-list {
    padding: var(--content-gap);
    background: var(--ui-bg);
  }

  .decks {
    display: flex;
    flex-direction: column;
    gap: var(--content-gap);
  }

  .message {
    text-align: center;
    padding: calc(var(--content-gap) * 2);
    color: var(--ui-muted);
    font-size: var(--ui-font-size);
    font-style: italic;
    background: var(--ui-bg);
    border: 1px solid var(--ui-border);
    border-radius: 4px;
  }

  .error {
    color: var(--toast-error);
    border-color: var(--toast-error);
    background: rgba(244, 67, 54, 0.05);
  }
</style> 