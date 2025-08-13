<script lang="ts">
  import type { Card } from '$lib/types';
  import { fade } from 'svelte/transition';
  import { toasts } from '$lib/stores/toast';
  import {
    createImageMigrationState,
    resetStateForCard,
    getCardsThatNeedMigration,
    getFirstCardToMigrate,
    getNextCardToMigrate,
    processImageUrl,
    createImageUpdateObject,
    canSaveMigration,
    IMAGE_PROCESSING_DEBOUNCE_MS,
    type ImageMigrationState
  } from './ImageMigrationDialog.svelte';

  const props = $props();
  const cards = props.cards as Card[];
  const onClose = props.onClose as () => void;
  const onUpdate = props.onUpdate as (id: string, updates: Partial<Card>) => Promise<void>;

  let dialogElement: HTMLDialogElement;
  let state = $state<ImageMigrationState>(createImageMigrationState());

  // Show dialog when mounted
  $effect(() => {
    dialogElement?.showModal();
  });

  // Get cards that need migration
  const needsMigration = $derived(getCardsThatNeedMigration(cards));

  // Auto-select first card when dialog opens or when list changes
  $effect(() => {
    if (needsMigration.length > 0 && !state.selectedCard) {
      state.selectedCard = needsMigration[0];
    }
  });

  // Reset state when card changes
  $effect(() => {
    if (state.selectedCard) {
      state = resetStateForCard(state);
    }
  });

  // Test URL when input changes (debounced)
  $effect(() => {
    if (!state.urlInput) {
      state.previewUrl = null;
      state.optimizedBlob = null;
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        state.loading = true;
        const result = await processImageUrl(state.urlInput);
        
        if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
        state.previewUrl = result.previewUrl;
        state.optimizedBlob = result.optimizedBlob;
      } catch (e) {
        state.previewUrl = null;
        state.optimizedBlob = null;
      } finally {
        state.loading = false;
      }
    }, IMAGE_PROCESSING_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  });

  async function handleSave() {
    if (!state.selectedCard || !canSaveMigration(state.urlInput, state.loading, state.optimizedBlob)) return;

    try {
      const updates = createImageUpdateObject(state.urlInput, state.optimizedBlob);
      await onUpdate(state.selectedCard.id, updates);

      toasts.success('Image updated successfully');

      const nextCard = getNextCardToMigrate(cards, state.selectedCard.id);
      if (nextCard) {
        state.selectedCard = nextCard;
      } else {
        toasts.success('All images have been migrated!');
        handleClose();
      }
    } catch (err) {
      toasts.error('Failed to update image');
    }
  }

  function handleClose() {
    dialogElement?.close();
    onClose();
  }
</script>

<dialog 
  bind:this={dialogElement}
  class="migration-dialog"
  onclose={handleClose}
>
  <div class="dialog-content">
    <div class="dialog-header">
      <h2>Migrate Images</h2>
      <button 
        class="close-button" 
        onclick={handleClose}
      >
        ×
      </button>
    </div>

    <div class="content">
      {#if needsMigration.length === 0}
        <div class="message success" transition:fade>
          <p>✓ All images are ready for sharing!</p>
        </div>
      {:else}
        <div class="card-list">
          <h3>Images to Migrate ({needsMigration.length})</h3>
          <div class="cards">
            {#each needsMigration as card}
              <button
                class="card-button"
                class:active={state.selectedCard?.id === card.id}
                onclick={() => state.selectedCard = card}
              >
                {card.name}
                {#if card.image === 'blob:local'}
                  <span class="tag">Local File</span>
                {:else}
                  <span class="tag">No URL</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        {#if state.selectedCard}
          <div class="migration-form" transition:fade>
            <h3>Migrate: {state.selectedCard.name}</h3>
            
            <div class="image-comparison">
              <div class="image-column">
                <h4>Current Image</h4>
                <div class="image-container">
                  <div 
                    class="image-preview"
                    style:background-image={state.selectedCard.imageBlob ? `url(${URL.createObjectURL(state.selectedCard.imageBlob)})` : 'none'}
                  >
                    {#if !state.selectedCard.imageBlob}
                      <span class="no-image">No image set</span>
                    {/if}
                  </div>
                </div>
              </div>

              <div class="image-column">
                <h4>New Image Preview</h4>
                <div class="image-container">
                  <div 
                    class="image-preview"
                    class:loading={state.loading}
                    style:background-image={state.previewUrl ? `url(${state.previewUrl})` : 'none'}
                  >
                    {#if state.loading}
                      <span class="loading-text">Loading...</span>
                    {:else if !state.previewUrl}
                      <span class="no-image">Enter a URL to preview</span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>

            <div class="url-input">
              <label>
                Image URL
                <input
                  type="url"
                  bind:value={state.urlInput}
                  placeholder="https://example.com/your-image.jpg - Enter URL to preview"
                />
              </label>
            </div>

            <button
              class="primary-button"
              disabled={!canSaveMigration(state.urlInput, state.loading, state.optimizedBlob)}
              onclick={handleSave}
            >
              {#if state.loading}
                Loading...
              {:else}
                Save & Continue
              {/if}
            </button>
          </div>
        {:else}
          <div class="select-prompt" transition:fade>
            <p>← Select a card to start migration</p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</dialog>

<style>
  .migration-dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    background: var(--ui-bg);
    color: var(--ui-text);
    box-shadow: var(--page-shadow);
    width: 800px;
    max-width: 90vw;
    max-height: 90vh;
  }

  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--content-gap);
    border-bottom: 1px solid var(--ui-border);
  }

  h2, h3, h4 {
    margin: 0;
    font-family: var(--ui-font-family);
  }

  h2 {
    font-size: var(--ui-title-size);
  }

  h3 {
    font-size: var(--ui-font-size);
    font-weight: bold;
  }

  h4 {
    font-size: var(--ui-font-size);
    color: var(--ui-muted);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    color: var(--ui-text);
  }

  .content {
    padding: var(--content-gap);
    display: flex;
    gap: 2rem;
    min-height: 400px;
  }

  .message {
    text-align: center;
    padding: 2rem;
    font-size: var(--ui-font-size);
  }

  .message.success {
    color: var(--toast-success);
  }

  .card-list {
    width: 200px;
    border-right: 1px solid var(--ui-border);
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .card-button {
    text-align: left;
    padding: 0.5rem;
    background: none;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    cursor: pointer;
    color: var(--ui-text);
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    transition: all 0.2s ease;
  }

  .card-button:hover {
    background: var(--ui-hover-bg);
  }

  .card-button.active {
    background: var(--ui-hover-bg);
    border-color: var(--button-bg);
  }

  .tag {
    font-size: 0.8em;
    color: var(--ui-muted);
  }

  .migration-form {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .select-prompt {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ui-muted);
    font-style: italic;
  }

  .image-comparison {
    display: flex;
    gap: 2rem;
    margin: 1rem 0;
  }

  .image-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .image-container {
    width: 200px;
    aspect-ratio: 5/7;
    background: var(--ui-hover-bg);
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .image-preview {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: top center;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s ease;
  }

  .image-preview.loading {
    opacity: 0.5;
  }

  .no-image,
  .loading-text {
    color: var(--ui-muted);
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }

  .loading-text {
    color: var(--ui-text);
  }

  .url-input {
    margin-top: 1rem;
  }

  .url-input label {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: var(--ui-font-size);
    color: var(--ui-muted);
  }

  input[type="url"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    background: var(--ui-bg);
    color: var(--ui-text);
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
  }

  input[type="url"]::placeholder {
    color: var(--ui-muted);
    font-style: italic;
  }

  .primary-button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    min-height: 36px;
    transition: all 0.2s ease;
    background: var(--button-bg);
    color: var(--button-text);
    border: 1px solid var(--button-border);
  }

  .primary-button:hover {
    background: var(--button-hover-bg);
  }

  .primary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style> 