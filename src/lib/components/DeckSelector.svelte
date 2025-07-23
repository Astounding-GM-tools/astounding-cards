<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDeck, clearDatabase, populateWithSampleData } from '$lib/stores/cards';
  import { listDecks, switchDeck, saveDeck } from '$lib/stores/cards';
  import type { CharacterDeck, CardSize } from '$lib/types';
  import { devMode } from '$lib/stores/dev';

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

  async function handleClearDatabase() {
    if (confirm('This will delete all decks. Are you sure?')) {
      await clearDatabase();
      window.location.reload(); // Refresh to clear everything
    }
  }

  async function handlePopulateSampleData() {
    if (confirm('Add sample deck with example cards?')) {
      const deck = await populateWithSampleData();
      window.location.reload(); // Refresh to show new data
    }
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

  {#if $devMode}
    <fieldset class="dev-controls">
      <legend>Dev Tools - be careful!</legend>
      <button 
        class="danger" 
        on:click={handleClearDatabase}
        title="Development only: Clear all data"
      >
        Clear Database
      </button>
      <button 
        class="sample" 
        on:click={handlePopulateSampleData}
        title="Development only: Add sample data"
      >
        Add Sample Data
      </button>
    </fieldset>
  {/if}
</div>

<style>
  .deck-settings {
    display: flex;
    flex-direction: column;
    gap: var(--content-gap);
    font-family: var(--ui-font-family);
  }

  fieldset {
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    padding: var(--content-gap);
    margin: 0;
    background: var(--ui-bg);
  }

  legend {
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    color: var(--ui-muted);
    padding: 0 var(--content-gap);
    background: var(--ui-bg);
  }

  select {
    width: 100%;
    padding: calc(var(--content-gap) * 0.75);
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    background: var(--ui-bg);
    color: var(--ui-text);
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    cursor: pointer;
  }

  select:hover {
    border-color: var(--button-primary-bg);
  }

  select:focus {
    outline: none;
    border-color: var(--button-primary-bg);
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
  }

  .status {
    display: block;
    padding: calc(var(--content-gap) * 0.75);
    color: var(--ui-muted);
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
  }

  .error {
    color: var(--toast-error);
  }

  .size-info {
    margin: var(--content-gap) 0 0;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    color: var(--ui-muted);
  }

  button {
    padding: calc(var(--content-gap) * 0.75) var(--content-gap);
    border: 1px solid var(--button-border);
    border-radius: 4px;
    background: var(--button-bg);
    color: var(--button-text);
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    cursor: pointer;
    transition: all 0.2s;
  }

  button:hover {
    background: var(--button-hover-bg);
    border-color: var(--button-primary-bg);
  }

  button:active {
    background: var(--button-active-bg);
  }

  /* Dev tools section */
  .dev-controls {
    border-color: var(--toast-warning);
    background: rgba(255, 152, 0, 0.05);
  }

  .dev-controls legend {
    color: var(--toast-warning);
    background: none;
  }

  .dev-controls {
    display: flex;
    gap: var(--content-gap);
  }

  button.danger {
    background: var(--toast-error);
    border-color: var(--toast-error);
    color: white;
  }

  button.danger:hover {
    opacity: 0.9;
  }

  button.sample {
    background: var(--button-primary-bg);
    border-color: var(--button-primary-bg);
    color: var(--button-primary-text);
  }

  button.sample:hover {
    background: var(--button-primary-hover);
  }
</style> 