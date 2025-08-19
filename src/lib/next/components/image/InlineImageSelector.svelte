<!--
  InlineImageSelector.svelte
  Compact inline image selector for embedding in forms
  No modal, no preview - just the selection controls
-->
<script lang="ts">
  import type { CardSize } from '$lib/types';
  import {
    initializeImageSelectorState,
    updateUrlValue,
    handleFileChange,
    handleUrlLoad,
    handleSaveAction,
    isProcessing,
    hasError,
    hasPreview,
    canSave,
    cleanupPreviewUrl,
    type ImageSelectorState
  } from '$lib/components/ui/ImageSelector.svelte.ts';

  const props = $props();
  const cardSize = (props.cardSize ?? 'tarot') as CardSize;
  const onImageChange = props.onImageChange as ((blob: Blob | null, sourceUrl?: string) => void) | undefined;
  const onRemoveImage = props.onRemoveImage as (() => void) | undefined;
  const hasExistingImage = props.hasExistingImage as boolean | undefined;
  
  let fileInput: HTMLInputElement;
  let urlInput: HTMLInputElement;
  let state = $state<ImageSelectorState>(initializeImageSelectorState());

  async function handleFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    
    state = await handleFileChange(state, file, cardSize);
    
    // Auto-save when file is processed
    if (hasPreview(state) && !hasError(state) && onImageChange) {
      state = await handleSaveAction(state, { 
        onSave: onImageChange, 
        onClose: () => {} 
      });
    }
  }

  async function handleUrl() {
    if (!state.urlValue) return;
    
    state = await handleUrlLoad(state, cardSize);
    
    // Auto-save when URL is loaded
    if (hasPreview(state) && !hasError(state) && onImageChange) {
      state = await handleSaveAction(state, { 
        onSave: onImageChange, 
        onClose: () => {} 
      });
    }
  }

  function handleRemove() {
    if (onRemoveImage) {
      onRemoveImage();
    }
    // Clear the inputs
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    state = initializeImageSelectorState();
  }

  // Cleanup preview URL when component is destroyed
  $effect(() => {
    return () => {
      cleanupPreviewUrl(state.previewUrl);
    };
  });
</script>

<div class="inline-image-selector">
  <div class="input-methods">
    <!-- File Upload -->
    <div class="file-input method">
      <label for="file-input">Upload File</label>
      <input
        bind:this={fileInput}
        type="file"
        id="file-input"
        accept="image/*"
        onchange={handleFile}
        disabled={isProcessing(state)}
      />
    </div>
    
    <!-- URL Input -->
    <div class="url-input method">
      <label for="url-input">Image URL</label>
      <div class="url-field">
        <input
          bind:this={urlInput}
          bind:value={state.urlValue}
          type="url"
          id="url-input"
          placeholder="https://..."
          oninput={(e) => state = updateUrlValue(state, (e.currentTarget as HTMLInputElement).value)}
          disabled={isProcessing(state)}
        />
        <button 
          onclick={handleUrl}
          disabled={isProcessing(state) || !state.urlValue}
          class="load-btn"
          type="button"
        >
          {isProcessing(state) ? '...' : 'Load'}
        </button>
      </div>
    </div>
  </div>

  <!-- Status and Actions -->
  <div class="status-actions">
    {#if isProcessing(state)}
      <div class="status processing">Loading image...</div>
    {:else if hasError(state)}
      <div class="status error">{state.error}</div>
    {:else if hasPreview(state)}
      <div class="status success">✓ Image ready</div>
    {/if}

    {#if hasExistingImage}
      <button 
        type="button"
        class="remove-btn"
        onclick={handleRemove}
      >
        Remove Image
      </button>
    {/if}
  </div>
</div>

<style>
  .inline-image-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .input-methods {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .method {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .method label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color);
  }

  .url-field {
    display: flex;
    gap: 0.25rem;
  }

  .url-field input {
    flex: 1;
    min-width: 0;
  }

  input[type="file"],
  input[type="url"] {
    padding: 0.375rem 0.5rem;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-family: var(--font-body);
    font-size: 0.85rem;
  }

  input[type="file"]:focus,
  input[type="url"]:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(74, 85, 104, 0.1);
  }

  input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .load-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 3px;
    background: var(--accent);
    color: white;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .load-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .load-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .status-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 2rem;
  }

  .status {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
  }

  .status.processing {
    background: #e3f2fd;
    color: #1976d2;
  }

  .status.error {
    background: #ffebee;
    color: #d32f2f;
  }

  .status.success {
    background: #e8f5e8;
    color: #2e7d32;
  }

  .remove-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid #fcc;
    border-radius: 3px;
    background: #fee;
    color: #c53030;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.8rem;
  }

  .remove-btn:hover {
    background: #fed7d7;
    border-color: #fc8181;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .input-methods {
      flex-direction: column;
    }
    
    .status-actions {
      flex-direction: column;
      gap: 0.5rem;
      align-items: stretch;
    }
  }
</style>
