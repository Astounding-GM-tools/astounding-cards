<script lang="ts">
  import type { Card } from '$lib/types';
  import { fade } from 'svelte/transition';
  import { processImage } from '$lib/utils/image';
  import { toasts } from '$lib/stores/toast';

  const props = $props<{
    cards: Card[];
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Card>) => Promise<void>;
  }>();

  let dialogElement: HTMLDialogElement;
  let loading = $state(false);
  let selectedCard = $state<Card | null>(null);
  let urlInput = $state('');
  let previewUrl = $state<string | null>(null);
  let optimizedBlob = $state<Blob | null>(null);

  // Show dialog when mounted
  $effect(() => {
    dialogElement?.showModal();
  });

  // Get cards that need migration
  const needsMigration = $derived(props.cards.filter((card: Card) => {
    if (!card.image) return false;
    return card.image === 'blob:local' || (!card.image.includes(':') && !card.image.startsWith('http'));
  }));

  // Auto-select first card when dialog opens or when list changes
  $effect(() => {
    if (needsMigration.length > 0 && !selectedCard) {
      selectedCard = needsMigration[0];
    }
  });

  // Reset state when card changes
  $effect(() => {
    if (selectedCard) {
      urlInput = '';
      previewUrl = null;
      optimizedBlob = null;
    }
  });

  // Test URL when input changes (debounced)
  $effect(() => {
    if (!urlInput) {
      previewUrl = null;
      optimizedBlob = null;
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        loading = true;
        const response = await fetch(urlInput);
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const blob = await response.blob();
        const file = new File([blob], 'image', { type: blob.type });
        
        const processed = await processImage(file);
        optimizedBlob = processed.blob;
        
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(processed.blob);
      } catch (e) {
        previewUrl = null;
        optimizedBlob = null;
      } finally {
        loading = false;
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  });

  async function handleSave() {
    if (!selectedCard || !urlInput) return;

    try {
      await props.onUpdate(selectedCard.id, {
        image: urlInput,
        imageBlob: optimizedBlob || undefined
      });

      toasts.success('Image updated successfully');

      // Get fresh list of remaining cards after update
      const remainingCards = props.cards.filter((card: Card) => {
        if (!card.image) return false;
        return card.image === 'blob:local' || (!card.image.includes(':') && !card.image.startsWith('http'));
      });

      if (remainingCards.length > 0) {
        // Find the next card that still needs migration
        const nextCard = remainingCards.find((card: Card) => card.id !== selectedCard?.id);
        if (nextCard) {
          selectedCard = nextCard;
        }
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
    props.onClose();
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
                class:active={selectedCard?.id === card.id}
                onclick={() => selectedCard = card}
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

        {#if selectedCard}
          <div class="migration-form" transition:fade>
            <h3>Migrate: {selectedCard.name}</h3>
            
            <div class="image-comparison">
              <div class="image-column">
                <h4>Current Image</h4>
                <div class="image-container">
                  <div 
                    class="image-preview"
                    style:background-image={selectedCard.imageBlob ? `url(${URL.createObjectURL(selectedCard.imageBlob)})` : 'none'}
                  >
                    {#if !selectedCard.imageBlob}
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
                    class:loading
                    style:background-image={previewUrl ? `url(${previewUrl})` : 'none'}
                  >
                    {#if loading}
                      <span class="loading-text">Loading...</span>
                    {:else if !previewUrl}
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
                  bind:value={urlInput}
                  placeholder="https://example.com/your-image.jpg - Enter URL to preview"
                />
              </label>
            </div>

            <button
              class="primary-button"
              disabled={!urlInput || loading || !optimizedBlob}
              onclick={handleSave}
            >
              {#if loading}
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