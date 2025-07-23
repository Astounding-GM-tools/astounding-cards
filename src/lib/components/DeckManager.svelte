<script lang="ts">
  import { currentDeck } from '$lib/stores/cards';
  import { deleteDeck, listDecks, duplicateDeck, copyCharactersTo, deleteCharacters, saveDeck } from '$lib/stores/cards';
  import type { Character, CharacterDeck } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { baseThemes } from '$lib/themes';

  export let deck: CharacterDeck;
  
  const dispatch = createEventDispatcher<{
    deckChange: { action: 'update' | 'delete' | 'duplicate' | 'copy' | 'deleteCharacters', deckId: string }
  }>();

  const themes = Object.values(baseThemes).map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description
  }));

  async function handleThemeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedTheme = select.value;

    const updatedDeck = {
      ...deck,
      meta: {
        ...deck.meta,
        theme: selectedTheme,
        lastEdited: Date.now()
      }
    };
    await saveDeck(updatedDeck);
    if ($currentDeck?.id === deck.id) {
      currentDeck.set(updatedDeck);
    }
    dispatch('deckChange', { action: 'update', deckId: deck.id });
  }

  let showDeleteConfirm = false;
  let showDuplicateDialog = false;
  let showCopyDialog = false;
  let showDeleteCharactersDialog = false;
  let editingName = false;
  let deleting = false;
  let duplicating = false;
  let copying = false;
  let deletingCharacters = false;
  let newDeckName = '';
  let editedDeckName = '';
  let selectedCharacters: Set<string> = new Set();
  let targetDeckId: string | 'new' = 'new';
  let availableDecks: CharacterDeck[] = [];

  async function loadAvailableDecks() {
    availableDecks = (await listDecks()).filter(d => d.id !== deck.id);
  }

  async function handleDelete() {
    if (!showDeleteConfirm) {
      showDeleteConfirm = true;
      return;
    }

    try {
      deleting = true;
      await deleteDeck(deck.id);
      dispatch('deckChange', { action: 'delete', deckId: deck.id });
      // If we're deleting the current deck, clear it
      if ($currentDeck?.id === deck.id) {
        const decks = await listDecks();
        if (decks.length > 0) {
          currentDeck.set(decks[0]);
        } else {
          currentDeck.set(null);
        }
      }
    } catch (e) {
      console.error('Failed to delete deck:', e);
    } finally {
      deleting = false;
      showDeleteConfirm = false;
    }
  }

  async function handleDuplicate() {
    if (!showDuplicateDialog) {
      showDuplicateDialog = true;
      newDeckName = `${deck.meta.name} (Copy)`;
      return;
    }

    try {
      duplicating = true;
      const newDeck = await duplicateDeck(deck, newDeckName);
      currentDeck.set(newDeck);
      dispatch('deckChange', { action: 'duplicate', deckId: newDeck.id });
      showDuplicateDialog = false;
    } catch (e) {
      console.error('Failed to duplicate deck:', e);
    } finally {
      duplicating = false;
    }
  }

  async function handleCopyCharacters() {
    if (!showCopyDialog) {
      showCopyDialog = true;
      await loadAvailableDecks();
      return;
    }

    if (selectedCharacters.size === 0) return;

    try {
      copying = true;
      const characters = deck.characters.filter(c => selectedCharacters.has(c.id));
      const targetDeck = await copyCharactersTo(
        characters,
        targetDeckId,
        targetDeckId === 'new' ? newDeckName : undefined
      );
      currentDeck.set(targetDeck);
      dispatch('deckChange', { action: 'copy', deckId: targetDeck.id });
      showCopyDialog = false;
      selectedCharacters.clear();
    } catch (e) {
      console.error('Failed to copy characters:', e);
    } finally {
      copying = false;
    }
  }

  async function handleDeleteCharacters() {
    if (!showDeleteCharactersDialog) {
      showDeleteCharactersDialog = true;
      await loadAvailableDecks();
      return;
    }

    if (selectedCharacters.size === 0) return;

    try {
      deletingCharacters = true;
      await deleteCharacters(deck.id, Array.from(selectedCharacters));
      dispatch('deckChange', { action: 'deleteCharacters', deckId: deck.id });
      showDeleteCharactersDialog = false;
      selectedCharacters.clear();
    } catch (e) {
      console.error('Failed to delete characters:', e);
    } finally {
      deletingCharacters = false;
    }
  }

  async function handleNameEdit() {
    if (!editingName) {
      editingName = true;
      editedDeckName = deck.meta.name;
      return;
    }

    if (!editedDeckName.trim() || editedDeckName === deck.meta.name) {
      editingName = false;
      return;
    }

    try {
      const updatedDeck = {
        ...deck,
        meta: {
          ...deck.meta,
          name: editedDeckName.trim(),
          lastEdited: Date.now()
        }
      };
      await saveDeck(updatedDeck);
      if ($currentDeck?.id === deck.id) {
        currentDeck.set(updatedDeck);
      }
      dispatch('deckChange', { action: 'update', deckId: deck.id });
      editingName = false;
    } catch (e) {
      console.error('Failed to update deck name:', e);
    }
  }

  function handleNameKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleNameEdit();
    } else if (event.key === 'Escape') {
      editingName = false;
      editedDeckName = deck.meta.name;
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString(navigator.language, { 
      dateStyle: 'short'
    });
  }

  function formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString(navigator.language, { 
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  function toggleCharacter(id: string) {
    if (selectedCharacters.has(id)) {
      selectedCharacters.delete(id);
    } else {
      selectedCharacters.add(id);
    }
    selectedCharacters = selectedCharacters; // trigger reactivity
  }

  // Select all/none for characters
  function selectAll() {
    deck.characters.forEach(char => selectedCharacters.add(char.id));
    selectedCharacters = selectedCharacters;
  }

  function selectNone() {
    selectedCharacters.clear();
    selectedCharacters = selectedCharacters;
  }
</script>

<div class="deck-manager">
  <div class="title-section">
    {#if editingName}
      <div class="name-edit">
        <input
          type="text"
          bind:value={editedDeckName}
          on:blur={handleNameEdit}
          on:keydown={handleNameKeydown}
          placeholder="Enter deck name"
        >
        <button 
          class="icon-button"
          on:click={handleNameEdit}
          title="Save name"
        >
          ✓
        </button>
        <button 
          class="icon-button"
          on:click={() => {
            editingName = false;
            editedDeckName = deck.meta.name;
          }}
          title="Cancel"
        >
          ×
        </button>
      </div>
    {:else}
      <div class="name-display">
        <h3>{deck.meta.name}</h3>
        <button 
          class="icon-button"
          on:click={handleNameEdit}
          title="Edit deck name"
        >
          ✎
        </button>
      </div>
    {/if}
  </div>

  <div class="deck-content">
    <div class="deck-info">
      <div class="info-line">
        <select 
          class="theme-select"
          value={deck.meta.theme}
          on:change={handleThemeChange}
        >
          {#each themes as theme (theme.id)}
            <option value={theme.id}>
              {theme.name}
            </option>
          {/each}
        </select>
        <span class="cards">{deck.characters.length} cards</span>
      </div>
      <div class="info-line date">
        <span class="date-label">Created</span> {formatDate(deck.meta.createdAt)}
      </div>
      <div class="info-line date">
        <span class="date-label">Edited</span> {formatDateTime(deck.meta.lastEdited)}
      </div>
    </div>

    <div class="actions">
      <fieldset class="action-group">
        <legend>Card</legend>
        <button 
          class="action-button"
          on:click={() => showCopyDialog = true}
          title="Copy selected cards to another deck"
        >
          Copy
        </button>
        <button 
          class="action-button danger"
          on:click={() => showDeleteCharactersDialog = true}
          title="Delete selected cards from this deck"
        >
          Delete
        </button>
      </fieldset>
      <fieldset class="action-group">
        <legend>Deck</legend>
        <button 
          class="action-button"
          on:click={handleDuplicate}
          disabled={duplicating}
          title="Create a copy of this entire deck"
        >
          {duplicating ? 'Duplicating...' : 'Duplicate'}
        </button>
        <button 
          class="action-button danger"
          on:click={handleDelete}
          disabled={deleting}
          title="Delete this deck and all its cards"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </fieldset>
    </div>
  </div>

  {#if showDeleteConfirm || showDuplicateDialog || showCopyDialog || showDeleteCharactersDialog}
    <div class="dialog-overlay"></div>
  {/if}

  {#if showDeleteConfirm}
    <div class="dialog">
      <span>Delete this deck?</span>
      <button 
        class="danger" 
        on:click={handleDelete}
        disabled={deleting}
      >
        {deleting ? 'Deleting...' : 'Confirm Delete'}
      </button>
      <button 
        class="secondary"
        on:click={() => showDeleteConfirm = false}
        disabled={deleting}
      >
        Cancel
      </button>
    </div>
  {:else if showDuplicateDialog}
    <div class="dialog">
      <input
        type="text"
        bind:value={newDeckName}
        placeholder="Enter new deck name"
      >
      <button 
        class="primary"
        on:click={handleDuplicate}
        disabled={duplicating || !newDeckName.trim()}
      >
        {duplicating ? 'Duplicating...' : 'Create Copy'}
      </button>
      <button 
        class="secondary"
        on:click={() => showDuplicateDialog = false}
        disabled={duplicating}
      >
        Cancel
      </button>
    </div>
  {:else if showCopyDialog}
    <div class="dialog copy-dialog">
      <div class="selection-controls">
        <button 
          class="small"
          on:click={selectAll}
          disabled={selectedCharacters.size === deck.characters.length}
        >
          Select All
        </button>
        <button 
          class="small"
          on:click={selectNone}
          disabled={selectedCharacters.size === 0}
        >
          Clear Selection
        </button>
        <span class="selection-count">
          {selectedCharacters.size} of {deck.characters.length} selected
        </span>
      </div>
      <div class="character-list">
        {#each deck.characters as char}
          <label class="character-item">
            <input
              type="checkbox"
              checked={selectedCharacters.has(char.id)}
              on:change={() => toggleCharacter(char.id)}
            >
            <span class="character-info">
              <strong>{char.name}</strong>
              <span class="character-role">{char.role}</span>
            </span>
          </label>
        {/each}
      </div>
      <div class="copy-options">
        <select bind:value={targetDeckId}>
          <option value="new">Create New Deck</option>
          {#each availableDecks as targetDeck}
            <option value={targetDeck.id}>{targetDeck.meta.name}</option>
          {/each}
        </select>
        {#if targetDeckId === 'new'}
          <input
            type="text"
            bind:value={newDeckName}
            placeholder="Enter new deck name"
          >
        {/if}
        <div class="dialog-buttons">
          <button 
            class="primary"
            on:click={handleCopyCharacters}
            disabled={copying || selectedCharacters.size === 0 || (targetDeckId === 'new' && !newDeckName.trim())}
          >
            {copying ? 'Copying...' : `Copy ${selectedCharacters.size} Character${selectedCharacters.size !== 1 ? 's' : ''}`}
          </button>
          <button 
            class="secondary"
            on:click={() => {
              showCopyDialog = false;
              selectedCharacters.clear();
            }}
            disabled={copying}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showDeleteCharactersDialog}
    <div class="dialog copy-dialog">
      <div class="selection-controls">
        <button 
          class="small"
          on:click={selectAll}
          disabled={selectedCharacters.size === deck.characters.length}
        >
          Select All
        </button>
        <button 
          class="small"
          on:click={selectNone}
          disabled={selectedCharacters.size === 0}
        >
          Clear Selection
        </button>
        <span class="selection-count">
          {selectedCharacters.size} of {deck.characters.length} selected
        </span>
      </div>
      <div class="character-list">
        {#each deck.characters as char}
          <label class="character-item">
            <input
              type="checkbox"
              checked={selectedCharacters.has(char.id)}
              on:change={() => toggleCharacter(char.id)}
            >
            <span class="character-info">
              <strong>{char.name}</strong>
              <span class="character-role">{char.role}</span>
            </span>
          </label>
        {/each}
      </div>
      <div class="dialog-buttons">
        <button 
          class="danger"
          on:click={handleDeleteCharacters}
          disabled={deletingCharacters || selectedCharacters.size === 0}
        >
          {deletingCharacters ? 'Deleting...' : `Delete ${selectedCharacters.size} Character${selectedCharacters.size !== 1 ? 's' : ''}`}
        </button>
        <button 
          class="secondary"
          on:click={() => {
            showDeleteCharactersDialog = false;
            selectedCharacters.clear();
          }}
          disabled={deletingCharacters}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .deck-manager {
    padding: 0.75rem;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    margin-bottom: 0;
    background: var(--ui-bg);
    position: relative;
    display: flex;
    flex-direction: column;
    font-family: var(--ui-font-family);
  }

  .deck-manager:hover {
    background: var(--ui-hover-bg);
  }

  .title-section {
    width: 100%;
  }

  .name-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .name-edit {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    width: 100%;
  }

  .name-edit input {
    flex: 1;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
  }

  h3 {
    margin: 0;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    font-weight: 600;
    flex: 1;
  }

  .deck-content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-start;
    justify-content: space-between;
  }

  .deck-info {
    width: 40%;
    min-width: 15em;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-right: 0.5rem;
  }

  .info-line {
    color: var(--ui-muted);
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    white-space: nowrap;
  }

  .info-line .cards {
    font-size: var(--ui-font-size);
  }

  .info-line.date {
    font-size: calc(var(--ui-font-size) * 0.9);
    color: var(--ui-muted);
  }

  .info-line.theme {
    font-size: var(--ui-font-size);
    color: var(--ui-muted);
  }

  .actions {
    width: 55%;
    min-width: 280px;
    display: flex;
    flex-direction: row;
    gap: 0.75rem;
    align-items: flex-start;
    justify-content: flex-end;
  }

  .action-group {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    margin: 0;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    background: var(--ui-bg);
  }

  .action-group legend {
    font-size: calc(var(--ui-font-size) * 0.9);
    font-family: var(--ui-font-family);
    color: var(--ui-muted);
    padding: 0 0.25rem;
    background: var(--ui-bg);
  }

  .action-button {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--button-border);
    border-radius: 4px;
    background: var(--button-bg);
    color: var(--button-text);
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .action-button:hover {
    background: var(--button-hover-bg);
    border-color: var(--button-primary-bg);
  }

  .action-button.danger {
    color: var(--toast-error);
    border-color: var(--toast-error);
  }

  .action-button.danger:hover {
    background: var(--toast-error);
    color: white;
  }

  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon-button {
    padding: 0.25rem 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    color: var(--ui-text);
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .icon-button:hover {
    opacity: 1;
  }

  .theme-select {
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    padding: 0.25rem;
    border: 1px solid var(--ui-border);
    border-radius: 3px;
    background: var(--ui-bg);
    color: var(--ui-text);
    max-width: 8em;
  }

  .theme-select:hover {
    border-color: var(--button-primary-bg);
  }

  .theme-select:focus {
    outline: none;
    border-color: var(--button-primary-bg);
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
  }

  /* Dialog styles */
  .dialog {
    font-family: var(--ui-font-family);
  }

  .dialog input {
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
  }

  .selection-count {
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    color: var(--ui-muted);
  }

  .character-info {
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
  }

  .character-role {
    font-family: var(--ui-font-family);
    font-size: calc(var(--ui-font-size) * 0.9);
    color: var(--ui-muted);
  }

  .date-label {
    display: inline-block;
    width: 4.5em;
  }

  .character-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
    max-height: 50vh;
    overflow-y: auto;
    padding: 0.5rem;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    background: var(--ui-bg);
  }

  .character-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 3px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .character-item:hover {
    background: var(--ui-hover-bg);
  }

  .character-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .character-info strong {
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    color: var(--ui-text);
  }

  .character-role {
    font-family: var(--ui-font-family);
    font-size: calc(var(--ui-font-size) * 0.9);
    color: var(--ui-muted);
  }

  .selection-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--ui-border);
  }

  .selection-count {
    margin-left: auto;
  }

  .copy-options {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .copy-options select,
  .copy-options input {
    padding: 0.5rem;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
  }

  .dialog-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
</style> 