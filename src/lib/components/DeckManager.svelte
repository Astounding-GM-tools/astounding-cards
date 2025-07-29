<script lang="ts">
  import { currentDeck } from '$lib/stores/deck';
  import { deleteDeck, listDecks, duplicateDeck, copyCardsTo, deleteCards, saveDeck } from '$lib/stores/deck';
  import type { Card, Deck } from '$lib/types';
  import { baseThemes } from '$lib/themes';
  import type { CardTheme } from '$lib/themes';
  import ThemeSelect from './ThemeSelect.svelte';
  import { createEventDispatcher } from 'svelte';
  import { toasts } from '$lib/stores/toast';

  const props = $props();
  let deck = $state(props.deck as Deck);
  
  const dispatch = createEventDispatcher<{
    deckchange: { action: 'update' | 'delete' | 'duplicate' | 'copy' | 'deleteCards', deckId: string };
  }>();

  function emitDeckChange(e: { action: 'update' | 'delete' | 'duplicate' | 'copy' | 'deleteCards', deckId: string }) {
    dispatch('deckchange', e);
  }

  let showThemeSelect = $state(false);
  let showDeleteConfirm = $state(false);
  let showDuplicateDialog = $state(false);
  let showDeleteCardsDialog = $state(false);
  let editingName = $state(false);
  let deleting = $state(false);
  let duplicating = $state(false);
  let deletingCards = $state(false);
  let newDeckName = $state('');
  let editedDeckName = $state('');
  let selectedCardIds = $state<string[]>([]);
  let targetDeckId = $state<string | 'new'>('new');
  let availableDecks = $state<Deck[]>([]);

  function toggleCard(id: string) {
    if (selectedCardIds.includes(id)) {
      selectedCardIds = selectedCardIds.filter(cardId => cardId !== id);
    } else {
      selectedCardIds = [...selectedCardIds, id];
    }
  }

  // Select all/none for cards
  function selectAll() {
    selectedCardIds = deck.cards.map((card: Card) => card.id);
  }

  function selectNone() {
    selectedCardIds = [];
  }

  async function handleThemeChange(themeId: string) {
    const updatedDeck = {
      ...deck,
      meta: {
        ...deck.meta,
        theme: themeId,
        lastEdited: Date.now()
      }
    };
    await saveDeck(updatedDeck);
    if ($currentDeck?.id === deck.id) {
      currentDeck.set(updatedDeck);
    }
    emitDeckChange({ action: 'update', deckId: deck.id });
    showThemeSelect = false;
  }

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
      emitDeckChange({ action: 'delete', deckId: deck.id });
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
      emitDeckChange({ action: 'duplicate', deckId: newDeck.id });
      showDuplicateDialog = false;
    } catch (e) {
      console.error('Failed to duplicate deck:', e);
    } finally {
      duplicating = false;
    }
  }

  async function handleDeleteCards() {
    if (!showDeleteCardsDialog) {
      showDeleteCardsDialog = true;
      return;
    }

    if (selectedCardIds.length === 0) return;

    try {
      deletingCards = true;
      const updatedDeck = await deleteCards(deck.id, selectedCardIds);
      if ($currentDeck?.id === deck.id) {
        currentDeck.set(updatedDeck); // Update in-memory store
      }
      deck = updatedDeck; // Update local prop
      emitDeckChange({ action: 'deleteCards', deckId: deck.id });
      showDeleteCardsDialog = false;
      const numDeleted = selectedCardIds.length;
      selectedCardIds = [];
      toasts.success(`Deleted ${numDeleted} card${numDeleted !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to delete cards:', error);
      toasts.error('Failed to delete cards');
    } finally {
      deletingCards = false;
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
        currentDeck.set(updatedDeck); // Update in-memory store
      }
      deck = updatedDeck; // Update local prop
      emitDeckChange({ action: 'update', deckId: deck.id });
      editingName = false;
      toasts.success('Deck name updated');
    } catch (error) {
      console.error('Failed to update deck name:', error);
      toasts.error('Failed to update deck name');
      editingName = false;
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
</script>

<div class="deck-manager">
  <div class="title-section">
    {#if editingName}
      <div class="name-edit">
        <input
          type="text"
          bind:value={editedDeckName}
          onblur={handleNameEdit}
          onkeydown={handleNameKeydown}
          placeholder="Enter deck name"
        >
        <button 
          class="icon-button"
          onclick={handleNameEdit}
          title="Save name"
        >
          ✓
        </button>
        <button 
          class="icon-button"
          onclick={() => {
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
          onclick={handleNameEdit}
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
        <span class="cards">{deck.cards.length} cards</span>
        <span class="theme-info">
          {baseThemes[deck.meta.theme]?.name || 'No theme'}
        </span>
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
          class="action-button danger"
          onclick={() => showDeleteCardsDialog = true}
          title="Delete selected cards from this deck"
        >
          Delete
        </button>
      </fieldset>
      <fieldset class="action-group">
        <legend>Deck</legend>
        <button 
          class="action-button danger"
          onclick={handleDelete}
          disabled={deleting}
          title="Delete this deck and all its cards"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </fieldset>
    </div>
  </div>

  {#if showDeleteConfirm || showDuplicateDialog || showDeleteCardsDialog}
    <div class="dialog-overlay"></div>
  {/if}

  {#if showDeleteConfirm}
    <div class="dialog-overlay">
      <button 
        class="overlay-button"
        onclick={() => showDeleteConfirm = false}
        onkeydown={(e) => e.key === 'Escape' && (showDeleteConfirm = false)}
        aria-label="Close delete confirmation"
      ></button>
    </div>
    <div class="dialog" role="alertdialog" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-desc">
      <h2 id="delete-dialog-title">Delete Confirmation</h2>
      <p id="delete-dialog-desc">Delete this deck?</p>
      <div class="dialog-buttons">
        <button 
          class="danger" 
          onclick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
        <button 
          class="secondary"
          onclick={() => showDeleteConfirm = false}
          disabled={deleting}
        >
          Cancel
        </button>
      </div>
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
        onclick={handleDuplicate}
        disabled={duplicating || !newDeckName.trim()}
      >
        {duplicating ? 'Duplicating...' : 'Create Copy'}
      </button>
      <button 
        class="secondary"
        onclick={() => showDuplicateDialog = false}
        disabled={duplicating}
      >
        Cancel
      </button>
    </div>
  {:else if showDeleteCardsDialog}
    <div class="dialog-overlay">
      <button 
        class="overlay-button"
        onclick={() => {
          showDeleteCardsDialog = false;
          selectedCardIds = [];
        }}
        onkeydown={(e) => {
          if (e.key === 'Escape') {
            showDeleteCardsDialog = false;
            selectedCardIds = [];
          }
        }}
        aria-label="Close card deletion dialog"
      ></button>
    </div>
    <div class="dialog copy-dialog" role="dialog" aria-labelledby="delete-cards-title">
      <h2 id="delete-cards-title">Delete Cards</h2>
      <div class="selection-controls">
        <button 
          class="small"
          onclick={selectAll}
          disabled={selectedCardIds.length === deck.cards.length}
          aria-label="Select all cards"
        >
          Select All
        </button>
        <button 
          class="small"
          onclick={selectNone}
          disabled={selectedCardIds.length === 0}
          aria-label="Clear selection"
        >
          Clear Selection
        </button>
        <span class="selection-count" role="status" aria-live="polite">
          {selectedCardIds.length} of {deck.cards.length} selected
        </span>
      </div>
      <div class="card-list" role="listbox" aria-multiselectable="true">
        {#each deck.cards as card (card.id)}
          <button 
            class="card-item" 
            role="option" 
            aria-selected={selectedCardIds.includes(card.id)}
            onclick={() => toggleCard(card.id)}
          >
            <input
              type="checkbox"
              checked={selectedCardIds.includes(card.id)}
              onchange={() => toggleCard(card.id)}
              aria-label="Select {card.name}"
            />
            <span class="card-info">
              <strong>{card.name}</strong>
              <span class="card-role">{card.role}</span>
            </span>
          </button>
        {/each}
      </div>
      <div class="dialog-buttons">
        <button 
          class="danger"
          onclick={handleDeleteCards}
          disabled={deletingCards || selectedCardIds.length === 0}
        >
          {deletingCards ? 'Deleting...' : `Delete ${selectedCardIds.length} Card${selectedCardIds.length !== 1 ? 's' : ''}`}
        </button>
        <button 
          class="secondary"
          onclick={() => {
            showDeleteCardsDialog = false;
            selectedCardIds = [];
          }}
          disabled={deletingCards}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}

  {#if showThemeSelect}
    <div class="dialog-overlay">
      <button 
        class="overlay-button"
        onclick={() => showThemeSelect = false}
        onkeydown={(e) => e.key === 'Escape' && (showThemeSelect = false)}
        aria-label="Close theme selector"
      ></button>
    </div>
    <div class="dialog theme-dialog" role="dialog" aria-labelledby="theme-dialog-title">
      <h2 id="theme-dialog-title">Select Theme</h2>
      <ThemeSelect
        selectedTheme={deck.meta.theme}
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
    gap: 1rem;
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    white-space: nowrap;
  }

  .info-line .cards {
    font-size: var(--ui-font-size);
    min-width: 4em;
  }

  .theme-info {
    color: var(--ui-text);
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
  }

  .info-line.date {
    font-size: calc(var(--ui-font-size) * 0.9);
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

  .theme-info {
    color: var(--ui-text);
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
  }

  .info-line.date {
    font-size: calc(var(--ui-font-size) * 0.9);
    color: var(--ui-muted);
  }

  .card-list {
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

  .card-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 3px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .card-item:hover {
    background: var(--ui-hover-bg);
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .card-info strong {
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    color: var(--ui-text);
  }

  .card-role {
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

  .dialog-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
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

  .dialog-buttons button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

.overlay-button {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}
</style> 