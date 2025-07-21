<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDeck } from '$lib/stores/cards';
  import { listDecks, switchDeck, saveDeck } from '$lib/stores/cards';
  import type { CharacterDeck, CardSize } from '$lib/types';

  let decks: CharacterDeck[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      decks = await listDecks();
      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load decks';
      loading = false;
    }
  });

  async function handleDeckChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    await switchDeck(select.value);
  }

  async function handleSizeChange(event: Event) {
    if (!$currentDeck) return;
    
    const select = event.target as HTMLSelectElement;
    const size = select.value as CardSize;
    
    const updatedDeck = {
      ...$currentDeck,
      meta: {
        ...$currentDeck.meta,
        cardSize: size
      }
    };
    
    await saveDeck(updatedDeck);
  }

  $: sortedDecks = decks.sort((a, b) => b.meta.lastEdited - a.meta.lastEdited);
</script>

<div class="deck-settings">
  <fieldset class="deck-selector">
    <legend>Select current deck</legend>
    {#if loading}
      <span class="status">Loading decks...</span>
    {:else if error}
      <span class="status error">{error}</span>
    {:else}
      <select 
        on:change={handleDeckChange}
        value={$currentDeck?.id}
      >
        {#each sortedDecks as deck (deck.id)}
          <option value={deck.id}>
            {deck.meta.name}
          </option>
        {/each}
      </select>
    {/if}
  </fieldset>

  {#if $currentDeck}
    <fieldset class="size-selector">
      <legend>Card size</legend>
      <select 
        on:change={handleSizeChange}
        value={$currentDeck.meta.cardSize || 'poker'}
      >
        <option value="poker">Poker (9 per page)</option>
        <option value="tarot">Tarot (4 per page)</option>
      </select>
      <p class="size-info">
        {$currentDeck.meta.cardSize === 'poker' 
          ? 'Standard playing card size, 9 cards per page'
          : 'Larger cards with more readable text, 4 cards per page'}
      </p>
    </fieldset>
  {/if}
</div>

<style>
  .deck-settings {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .deck-selector, .size-selector {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 1rem;
  }

  legend {
    padding: 0 0.5rem;
    color: #666;
  }

  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    font-size: 1rem;
  }

  .status {
    font-size: 0.9rem;
    color: #666;
  }

  .error {
    color: #c62828;
  }

  .size-info {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
  }
</style> 