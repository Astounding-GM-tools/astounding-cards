<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDeck, clearDatabase, populateWithSampleData } from '$lib/stores/deck';
  import { listDecks, switchDeck, saveDeck } from '$lib/stores/deck';
  import type { Deck, CardSize } from '$lib/types';
  import { devMode } from '$lib/stores/dev';
  import { baseThemes } from '$lib/themes';
  import ThemeSelect from './ThemeSelect.svelte';

  let decks = $state<Deck[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showThemeSelect = $state(false);

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

  async function handleThemeChange(themeId: string) {
    if (!$currentDeck) return;
    
    const updatedDeck = {
      ...$currentDeck,
      meta: {
        ...$currentDeck.meta,
        theme: themeId,
        lastEdited: Date.now()
      }
    };
    
    await saveDeck(updatedDeck);
    showThemeSelect = false;
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

  const sortedDecks = $derived(decks.sort((a, b) => b.meta.lastEdited - a.meta.lastEdited));
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
        onchange={handleDeckChange}
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
        onchange={handleSizeChange}
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

    <fieldset class="theme-selector">
      <legend>Card theme</legend>
      <button 
        class="theme-button"
        onclick={() => showThemeSelect = true}
      >
        <div class="theme-info">
          <strong>{baseThemes[$currentDeck.meta.theme]?.name}</strong>
          <span class="theme-desc">{baseThemes[$currentDeck.meta.theme]?.preview?.role}</span>
        </div>
        <span class="change-theme">Change theme</span>
      </button>
    </fieldset>
  {/if}

  {#if $devMode}
    <fieldset class="dev-controls">
      <legend>Dev Tools - be careful!</legend>
      <button 
        class="danger" 
        onclick={handleClearDatabase}
        title="Development only: Clear all data"
      >
        Clear Database
      </button>
      <button 
        class="sample" 
        onclick={handlePopulateSampleData}
        title="Development only: Add sample data"
      >
        Add Sample Data
      </button>
    </fieldset>
  {/if}
</div>

{#if showThemeSelect}
  <div class="dialog-overlay" onclick={() => showThemeSelect = false}></div>
  <div class="dialog theme-dialog">
    <h2>Select Theme</h2>
    <ThemeSelect
      selectedTheme={$currentDeck?.meta.theme}
      onSelect={handleThemeChange}
    />
    <div class="dialog-buttons">
      <button 
        class="secondary"
        onclick={() => showThemeSelect = false}
      >
        Cancel
      </button>
    </div>
  </div>
{/if}

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

  .theme-button {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: calc(var(--content-gap) * 0.75) var(--content-gap);
    text-align: left;
  }

  .theme-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .theme-desc {
    color: var(--ui-muted);
    font-size: calc(var(--ui-font-size) * 0.9);
  }

  .change-theme {
    color: var(--button-primary-bg);
    font-size: calc(var(--ui-font-size) * 0.9);
  }

  /* Dialog styles */
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--ui-bg);
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 101;
    min-width: 300px;
  }

  .theme-dialog {
    width: 90vw;
    max-width: 1200px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .theme-dialog h2 {
    margin: 0 0 1rem 0;
    font-size: var(--ui-title-size);
    font-family: var(--ui-font-family);
    font-weight: 600;
  }

  .dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .dialog-buttons button {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--button-border);
    border-radius: 4px;
    background: var(--button-bg);
    color: var(--button-text);
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    cursor: pointer;
    transition: all 0.2s;
  }

  .dialog-buttons button:hover {
    background: var(--button-hover-bg);
  }

  .dialog-buttons button.primary {
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
    border-color: var(--button-primary-bg);
  }

  .dialog-buttons button.primary:hover {
    background: var(--button-primary-hover);
  }

  .dialog-buttons button.secondary:hover {
    border-color: var(--button-primary-bg);
  }

  .dialog-buttons button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style> 