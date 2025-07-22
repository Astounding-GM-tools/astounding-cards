<script lang="ts">
  import { currentDeck } from '$lib/stores/cards';
  import { deleteDeck, listDecks, duplicateDeck, copyCharactersTo, deleteCharacters, saveDeck } from '$lib/stores/cards';
  import type { Character, CharacterDeck } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { baseThemes } from '$lib/themes';
  import CharacterCardFront from './CharacterCardFront.svelte';
  import CharacterCardBack from './CharacterCardBack.svelte';

  export let deck: CharacterDeck;
  
  const dispatch = createEventDispatcher<{
    deckChange: { action: 'update' | 'delete' | 'duplicate' | 'copy' | 'deleteCharacters', deckId: string }
  }>();

  const themes = Object.values(baseThemes).map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description
  }));

  let showThemeDialog = false;
  let selectedTheme = deck.meta.theme;
  let showCardBack = false;
  const exampleCharacter: Character = {
    id: 'preview',
    name: 'Example Character',
    role: 'Preview Role',
    portrait: null,
    traits: ['Sample trait 1', 'Sample trait 2', 'Sample trait 3'],
    secrets: ['Sample secret 1', 'Sample secret 2'],
    desc: 'This is an example character to preview the theme styling.',
    stat: { type: 'character', value: '30' }
  };

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

  function toggleCardPreview() {
    showCardBack = !showCardBack;
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
      <div class="info-line cards">{deck.characters.length} cards</div>
      <div class="info-line date">Last edited: {formatDate(deck.meta.lastEdited)}</div>
      <div class="info-line theme">
        Theme: 
        <select 
          value={deck.meta.theme}
          on:change={handleThemeChange}
        >
          {#each themes as theme (theme.id)}
            <option value={theme.id}>
              {theme.name}
            </option>
          {/each}
        </select>
      </div>
    </div>

    <div class="actions">
      <div class="action-group">
        <button 
          class="action-button"
          on:click={handleDuplicate}
          disabled={duplicating}
        >
          {duplicating ? 'Duplicating...' : 'Duplicate Deck'}
        </button>
      </div>
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

  {#if showThemeDialog}
    <div class="theme-dialog-overlay"></div>
    <div class="theme-dialog">
      <div class="theme-dialog-header">
        <h3>Select Theme</h3>
        <button 
          class="close-button"
          on:click={() => showThemeDialog = false}
        >
          ×
        </button>
      </div>
      <div class="theme-dialog-content">
        <div class="theme-list">
          {#each themes as theme (theme.id)}
            <label class="theme-option">
              <input
                type="radio"
                name="theme"
                value={theme.id}
                bind:group={selectedTheme}
              >
              <div class="theme-info">
                <strong>{theme.name}</strong>
                <span class="theme-description">{theme.description}</span>
              </div>
            </label>
          {/each}
        </div>
        <div class="preview-section">
          <div class="preview-card" class:flipped={showCardBack}>
            <div class="preview-front">
              <CharacterCardFront
                character={exampleCharacter}
                showCropMarks={false}
                onChange={() => {}}
              />
            </div>
            <div class="preview-back">
              <CharacterCardBack
                character={exampleCharacter}
                showCropMarks={false}
                onChange={() => {}}
              />
            </div>
          </div>
          <button 
            class="flip-button"
            on:click={toggleCardPreview}
          >
            {showCardBack ? 'Show Front' : 'Show Back'}
          </button>
        </div>
      </div>
      <div class="theme-dialog-footer">
        <button 
          class="primary"
          on:click={handleThemeChange}
        >
          Apply Theme
        </button>
        <button 
          class="secondary"
          on:click={() => showThemeDialog = false}
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
    font-size: 1rem;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
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
    width: 30%;
    min-width: 10em;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-right: 0.5rem;
  }

  .info-line {
    color: var(--ui-muted);
    line-height: 1.4;
  }

  .info-line.cards {
    font-size: 0.8rem;
  }

  .info-line.date {
    font-size: 0.75rem;
  }

  .info-line.theme {
    font-size: 0.8rem;
    color: var(--ui-muted);
  }

  .actions {
    width: 60%;
    min-width: 280px;
    display: flex;
    flex-direction: row;
    gap: 0.75rem;
    align-items: flex-start;
    justify-content: flex-end;
  }

  .action-group {
    width: fit-content;
    border: 1px solid var(--ui-border);
    border-radius: 3px;
    padding: 0.5rem;
    margin: 0;
  }

  .action-button {
    padding: calc(var(--content-gap) * 0.75) var(--content-gap);
    border: 1px solid var(--button-border);
    border-radius: 4px;
    background: var(--button-bg);
    color: var(--button-text);
    font-size: var(--ui-font-size);
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-button:hover {
    background: var(--button-hover-bg);
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
    font-size: 1rem;
    color: var(--ui-text);
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .icon-button:hover {
    opacity: 1;
  }
</style> 