<script lang="ts">
  import { currentDeck } from '$lib/stores/cards';
  import { deleteDeck, listDecks, duplicateDeck, copyCharactersTo, deleteCharacters, saveDeck } from '$lib/stores/cards';
  import type { Character, CharacterDeck } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { baseThemes } from '$lib/themes';
  import CharacterCardFront from './CharacterCardFront.svelte';
  import CharacterCardBack from './CharacterCardBack.svelte';

  export let deck: CharacterDeck;
  
  // Log locale information
  console.log('Navigator language:', navigator.language);
  console.log('Navigator languages:', navigator.languages);
  
  const dispatch = createEventDispatcher<{
    deckChange: { action: 'update' | 'delete' | 'duplicate' | 'copy' | 'deleteCharacters', deckId: string }
  }>();

  let showShareTooltip = false;
  let shareTooltipTimer: number;

  async function copyShareUrl() {
    const origin = window.location.origin;
    const deckData = encodeURIComponent(JSON.stringify(deck));
    const shareUrl = `${origin}/?deck=${deckData}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      showShareTooltip = true;
      if (shareTooltipTimer) clearTimeout(shareTooltipTimer);
      shareTooltipTimer = window.setTimeout(() => {
        showShareTooltip = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }

  const themes = Object.values(baseThemes).map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description
  }));

  let showThemeDialog = false;
  let selectedTheme = deck.meta.theme;
  let showCardBack = false;
  let previewCard = deck.characters[0] || {
    id: 'preview',
    name: 'Example Character',
    role: 'Preview Role',
    age: '30',
    portrait: null,
    traits: ['Sample trait 1', 'Sample trait 2', 'Sample trait 3'],
    bio: 'This is an example character to preview the theme styling.'
  };

  async function handleThemeChange() {
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
    showThemeDialog = false;
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
          autofocus
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
      <div class="info-line theme">
        <button 
          class="theme-button"
          on:click={() => showThemeDialog = true}
        >
          {baseThemes[deck.meta.theme]?.name || 'Select theme'}
        </button>
      </div>
      <div class="info-line cards">{deck.characters.length} cards</div>
      <div class="info-line date">Created {formatDate(deck.meta.createdAt)}</div>
      <div class="info-line date">Updated {formatDate(deck.meta.lastEdited)}</div>
      <div class="info-line share">
        <button 
          class="share-button"
          on:click={copyShareUrl}
        >
          Copy Share URL
          {#if showShareTooltip}
            <span class="tooltip">Copied!</span>
          {/if}
        </button>
      </div>
    </div>

    <div class="actions">
      <fieldset class="action-group">
        <legend>Card</legend>
        <button 
          class="action-button danger"
          on:click={handleDeleteCharacters}
        >
          Delete
        </button>
        <button 
          class="action-button"
          on:click={handleCopyCharacters}
        >
          Copy
        </button>
      </fieldset>
      <fieldset class="action-group">
        <legend>Deck</legend>
        <button 
          class="action-button danger"
          on:click={handleDelete}
        >
          Delete
        </button>
        <button 
          class="action-button"
          on:click={handleDuplicate}
        >
          Duplicate
        </button>
      </fieldset>
    </div>
  </div>

  {#if showDeleteConfirm || showDuplicateDialog || showCopyDialog || showDeleteCharactersDialog}
    <div class="dialog-overlay" />
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
    <div class="theme-dialog-overlay" />
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
                character={previewCard}
                showCropMarks={false}
                onChange={() => {}}
              />
            </div>
            <div class="preview-back">
              <CharacterCardBack
                character={previewCard}
                showCropMarks={false}
                gridPosition={1}
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
    border: 1px solid #eee;
    border-radius: 4px;
    margin-bottom: 0;
    background: white;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .deck-manager:hover {
    background: #f9f9f9;
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
    border: 1px solid #ccc;
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
    color: #666;
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
    color: #666;
  }

  .theme-select {
    font-size: 0.8rem;
    padding: 2px 4px;
    border: 1px solid #eee;
    border-radius: 3px;
    background: white;
    color: #666;
    cursor: pointer;
  }

  .theme-select:hover {
    border-color: #ccc;
  }

  .theme-select:focus {
    outline: none;
    border-color: #4a90e2;
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
    border: 1px solid #eee;
    border-radius: 3px;
    padding: 0.5rem;
    margin: 0;
  }

  .action-group legend {
    font-size: 0.75rem;
    color: #666;
    padding: 0 0.25rem;
  }

  .action-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    border: none;
    border-radius: 3px;
    background: #f0f0f0;
    color: #333;
    cursor: pointer;
    white-space: nowrap;
  }

  .action-button:not(:last-child) {
    margin-right: 0.25rem;
  }

  .action-button:hover {
    background: #e0e0e0;
  }

  .action-button.danger {
    background: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
  }

  .action-button.danger:hover {
    background: #ef9a9a;
    color: #fff;
    border-color: #ef9a9a;
  }

  .dialog-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.8);
    z-index: 1;
    border-radius: 4px;
  }

  .dialog {
    position: absolute;
    right: 0;
    top: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    padding: 0.75rem;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 110;
    border: 1px solid #eee;
  }

  .copy-dialog {
    min-width: 300px;
  }

  .character-list {
    max-height: 200px;
    overflow-y: auto;
    width: 100%;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 0.5rem;
  }

  .character-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem;
    cursor: pointer;
  }

  .copy-options {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  select, input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .primary {
    background: #4a90e2;
    color: white;
  }

  .primary:hover:not(:disabled) {
    background: #357abd;
  }

  .secondary {
    background: #f5f5f5;
    color: #333;
  }

  .secondary:hover:not(:disabled) {
    background: #e0e0e0;
  }

  .danger {
    background: #c62828;
    color: white;
  }

  .danger.outline {
    background: transparent;
    border: 1px solid #c62828;
    color: #c62828;
  }

  .danger:hover:not(:disabled) {
    background: #b71c1c;
  }

  .name-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .name-edit {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .name-edit input {
    font-size: 1.1rem;
    font-weight: bold;
    min-width: 200px;
  }

  .icon-button {
    padding: 0.25rem;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 4px;
    font-size: 1rem;
    color: #666;
  }

  .icon-button:hover {
    background: #f0f0f0;
    color: #333;
  }

  .selection-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .selection-count {
    margin-left: auto;
    font-size: 0.9rem;
    color: #666;
  }

  button.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }

  .character-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .character-role {
    font-size: 0.8rem;
    color: #666;
  }

  .theme-button {
    font-size: 0.8rem;
    padding: 2px 4px;
    border: 1px solid #eee;
    border-radius: 3px;
    background: white;
    color: #666;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .theme-button:hover {
    border-color: #ccc;
  }

  .theme-dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .theme-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    width: 90vw;
    max-width: 1000px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .theme-dialog-header {
    padding: 1rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .theme-dialog-header h3 {
    margin: 0;
    font-size: 1.2rem;
  }

  .theme-dialog-content {
    display: flex;
    gap: 2rem;
    padding: 1rem;
    overflow: auto;
  }

  .theme-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 300px;
  }

  .theme-option {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #eee;
    border-radius: 4px;
    cursor: pointer;
  }

  .theme-option:hover {
    background: #f9f9f9;
  }

  .theme-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .theme-description {
    font-size: 0.8rem;
    color: #666;
  }

  .preview-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .preview-card {
    width: 63.5mm;
    height: 88.9mm;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.6s;
  }

  .preview-card.flipped {
    transform: rotateY(180deg);
  }

  .preview-front,
  .preview-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .preview-back {
    transform: rotateY(180deg);
  }

  .flip-button {
    padding: 0.5rem 1rem;
    background: #f0f0f0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .theme-dialog-footer {
    padding: 1rem;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .share-button {
    font-size: 0.8rem;
    padding: 2px 4px;
    border: 1px solid #eee;
    border-radius: 3px;
    background: white;
    color: #666;
    cursor: pointer;
    text-align: left;
    width: 100%;
    position: relative;
  }

  .share-button:hover {
    border-color: #ccc;
    background: #f9f9f9;
  }

  .tooltip {
    position: absolute;
    right: -4rem;
    top: 50%;
    transform: translateY(-50%);
    background: #333;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.75rem;
    pointer-events: none;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style> 