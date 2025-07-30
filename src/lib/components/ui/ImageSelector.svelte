<!--
  ImageSelector.svelte
  Handles image selection via file upload or URL input
  Processes and previews images before saving
-->
<script lang="ts">
  import { processImage } from '$lib/utils/image';
  import type { CardSize } from '$lib/types';
  import { fade } from 'svelte/transition';
  import { createBlobUrl, revokeBlobUrl } from '$lib/utils/image-handler';

  const props = $props();
  const cardSize = (props.cardSize ?? 'tarot') as CardSize;
  const onSave = props.onSave as ((blob: Blob | null, sourceUrl?: string) => void) | undefined;
  const onClose = props.onClose as (() => void) | undefined;
  const hasExistingImage = props.hasExistingImage as boolean | undefined;
  
  let fileInput: HTMLInputElement;
  let urlInput: HTMLInputElement;
  let saveButton: HTMLButtonElement;
  let urlValue = $state('');
  let error = $state('');
  let loading = $state(false);
  let lastProcessedBlob = $state<Blob | undefined>(undefined);
  let previewUrl = $state<string | null>(null);

  // Focus save button when image is loaded
  $effect(() => {
    if (previewUrl && !loading && !error && saveButton) {
      saveButton.focus();
    }
  });

  async function handleFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      loading = true;
      error = '';
      console.log('Processing file:', file.name, file.type, file.size);
      
      // Revoke previous URL if it exists
      if (previewUrl) {
        revokeBlobUrl(previewUrl);
        previewUrl = null;
      }
      
      // Process the image
      const processed = await processImage(file, cardSize);
      console.log('Processed image:', processed);
      lastProcessedBlob = processed.blob;
      previewUrl = createBlobUrl(processed.blob);
      console.log('Updated preview URL:', previewUrl);
    } catch (e) {
      console.error('Image processing error:', e);
      error = e instanceof Error ? e.message : 'Failed to process image';
      if (previewUrl) {
        revokeBlobUrl(previewUrl);
        previewUrl = null;
      }
      lastProcessedBlob = undefined;
    } finally {
      loading = false;
    }
  }

  async function handleUrl() {
    if (!urlValue) return;
    
    try {
      loading = true;
      error = '';
      
      if (previewUrl) {
        revokeBlobUrl(previewUrl);
        previewUrl = null;
      }
      
      // Fetch and process the image
      const response = await fetch(urlValue);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const file = new File([blob], 'image', { type: blob.type });
      
      // Process the image
      const processed = await processImage(file, cardSize);
      lastProcessedBlob = processed.blob;
      previewUrl = createBlobUrl(processed.blob);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load image';
      if (previewUrl) {
        revokeBlobUrl(previewUrl);
        previewUrl = null;
      }
      lastProcessedBlob = undefined;
    } finally {
      loading = false;
    }
  }

  async function handleSave() {
    if (onSave) {
      try {
        loading = true;
        // Pass the blob and let the parent handle URL conversion
        await onSave(lastProcessedBlob || null, urlValue || undefined);
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to save image';
      } finally {
        loading = false;
      }
    }
  }

  async function handleUnset() {
    if (onSave) {
      try {
        loading = true;
        await onSave(null, undefined);
        if (onClose) onClose();
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to unset image';
      } finally {
        loading = false;
      }
    }
  }

  function handleClose() {
    if (onClose) onClose();
  }

  // Cleanup preview URL when component is destroyed
  $effect(() => {
    return () => {
      if (previewUrl) {
        revokeBlobUrl(previewUrl);
      }
    };
  });
</script>

<div class="image-selector">
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h2>Select Image</h2>
          <button 
            class="close-button" 
            onclick={handleClose}
          >
            ×
          </button>
        </div>
        
        <div class="input-methods">
          <!-- Left side: Input methods -->
          <div class="input-column">
            <div class="file-input method">
              <h3>Upload File</h3>
              <input
                bind:this={fileInput}
                type="file"
                id="file"
                accept="image/*"
                onchange={handleFile}
              />
            </div>
            
            <div class="url-input method">
              <h3>Image URL</h3>
              <div class="url-field">
                <input
                  bind:this={urlInput}
                  bind:value={urlValue}
                  type="url"
                  id="url"
                  placeholder="https://..."
                />
                <button 
                  onclick={() => handleUrl()}
                  disabled={loading || !urlValue}
                  class="load-btn"
                >
                  Load
                </button>
              </div>
            </div>
          </div>

          <!-- Right side: Preview -->
          <div class="preview-column">
            <div class="preview-container">
              {#if loading}
                <div class="preview loading">
                  <div class="loading-indicator"></div>
                </div>
              {:else if error}
                <div class="preview error">
                  <div class="status error">{error}</div>
                </div>
              {:else if previewUrl}
                <div class="preview" transition:fade>
                  <img 
                    src={previewUrl} 
                    alt="Preview"
                  />
                </div>
              {:else}
                <div class="preview-placeholder">
                  Preview will appear here
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="dialog-buttons">
          {#if hasExistingImage}
            <button 
              class="unset-btn" 
              onclick={handleUnset}
            >
              Remove Image
            </button>
          {/if}
          <button 
            class="cancel-btn" 
            onclick={handleClose}
          >
            Cancel
          </button>
          <button 
            class="save-btn" 
            bind:this={saveButton}
            onclick={handleSave}
            disabled={!previewUrl || !lastProcessedBlob}
            title={previewUrl ? '' : 'No image chosen'}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .image-selector {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }

  .dialog-overlay {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dialog {
    background: var(--theme-bg, white);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 800px;
    height: fit-content;
  }

  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--theme-border, #ccc);
  }

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--theme-text);
  }

  h3 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
    color: var(--theme-text);
  }

  .input-methods {
    display: flex;
    gap: 1.5rem;
    padding: 0.75rem 1rem;
  }

  .input-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .preview-column {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
  }

  .method {
    padding: 0.75rem;
    background: var(--theme-secondary-bg, #f5f5f5);
    border-radius: 4px;
  }

  .url-field {
    display: flex;
    gap: 0.5rem;
  }

  .url-field input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem;
    border: 1px solid var(--theme-border, #ccc);
    border-radius: 4px;
    font-size: 1rem;
  }

  .preview-container {
    width: 100%;
    max-width: 280px;
    aspect-ratio: 5/7;
  }

  .preview, .preview-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview {
    border: 1px solid var(--theme-border, #ccc);
    background: var(--theme-secondary-bg, #f5f5f5);
    position: relative;
    overflow: hidden;
  }

  .preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
  }

  .preview.loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-indicator {
    width: 40px;
    height: 40px;
    border: 3px solid var(--theme-border, #ccc);
    border-top-color: var(--theme-primary, #333);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .preview-placeholder {
    color: var(--theme-text-muted, #666);
    text-align: center;
    border: 2px dashed var(--theme-border, #ccc);
    padding: 0.75rem;
  }

  .status {
    padding: 1rem;
    border-radius: 4px;
    text-align: center;
    width: 100%;
  }

  .loading {
    background: var(--theme-secondary-bg, #f0f0f0);
  }

  .error {
    background: var(--theme-error-bg, #fff0f0);
    color: var(--theme-error, #c00);
  }

  .dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--theme-border, #ccc);
  }

  button {
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    border: none;
    font-size: 0.9rem;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }

  .load-btn {
    background: var(--theme-secondary, #666);
    color: white;
  }

  .unset-btn {
    background: var(--theme-error, #c00);
    color: white;
    margin-right: auto;
  }

  .cancel-btn {
    background: var(--theme-secondary-bg, #f0f0f0);
    color: var(--theme-text);
  }

  .save-btn {
    background: var(--theme-primary, #333);
    color: white;
  }

  input[type="file"] {
    max-width: 100%;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
  }
</style> 