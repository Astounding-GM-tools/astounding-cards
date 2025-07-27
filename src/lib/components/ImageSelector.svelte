<!--
  ImageSelector.svelte
  Handles image selection via file upload or URL input
  Processes and previews images before saving
-->
<script lang="ts">
  import { processImage } from '$lib/utils/image';
  import type { CardSize } from '$lib/types';

  const props = $props<{
    cardSize?: CardSize;
    onSave?: (blob: Blob, sourceUrl?: string) => void;
    onClose?: () => void;
  }>();
  const cardSize = props.cardSize ?? 'tarot';
  
  let fileInput: HTMLInputElement;
  let urlInput: HTMLInputElement;
  let urlValue = $state('');
  let error = $state('');
  let loading = $state(false);
  let previewUrl = $state('');
  let lastProcessedBlob: Blob | undefined;

  async function handleFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      loading = true;
      error = '';
      
      // Process the image
      const processed = await processImage(file, cardSize);
      lastProcessedBlob = processed.blob;
      
      // Create preview URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(processed.blob);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to process image';
      previewUrl = '';
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
      
      // Fetch and process the image
      const response = await fetch(urlValue);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const file = new File([blob], 'image', { type: blob.type });
      
      // Process the image
      const processed = await processImage(file, cardSize);
      lastProcessedBlob = processed.blob;
      
      // Create preview URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(processed.blob);
      
      // Don't save automatically, let user confirm with Save button
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load image';
      previewUrl = '';
      lastProcessedBlob = undefined;
    } finally {
      loading = false;
    }
  }

  async function handleSave() {
    if (previewUrl && lastProcessedBlob && props.onSave) {
      try {
        loading = true;
        // Pass URL only if we're saving a URL-loaded image
        await props.onSave(lastProcessedBlob, urlValue || undefined);
        if (props.onClose) props.onClose();
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to save image';
      } finally {
        loading = false;
      }
    }
  }

  function handleClose() {
    if (props.onClose) props.onClose();
  }

  // Cleanup preview URL when component is destroyed
  $effect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  });
</script>

<div class="image-selector">
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-content">
        <h2>Select Image</h2>
        
        <div class="input-methods">
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

        {#if loading}
          <div class="status loading">Processing image...</div>
        {/if}
        
        {#if error}
          <div class="status error">{error}</div>
        {/if}

        {#if previewUrl}
          <div class="preview-container">
            <div class="preview">
              <img src={previewUrl} alt="Preview" />
            </div>
          </div>
        {/if}

        <div class="dialog-buttons">
          <button 
            class="cancel-btn" 
            onclick={handleClose}
          >
            Cancel
          </button>
          <button 
            class="save-btn" 
            onclick={handleSave}
            disabled={!previewUrl || !lastProcessedBlob}
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
    max-height: 90vh;
    overflow-y: auto;
  }

  .dialog-content {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--theme-text);
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    color: var(--theme-text);
  }

  .input-methods {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .method {
    padding: 1rem;
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
    display: flex;
    justify-content: center;
  }

  .preview {
    aspect-ratio: 5/7;
    width: 100%;
    max-width: 300px;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid var(--theme-border, #ccc);
  }

  .preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .status {
    padding: 1rem;
    border-radius: 4px;
    text-align: center;
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
    gap: 1rem;
    margin-top: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    font-size: 1rem;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .load-btn {
    background: var(--theme-secondary, #666);
    color: white;
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