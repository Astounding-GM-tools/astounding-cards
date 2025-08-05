<script lang="ts">
  import type { Card, Deck } from '$lib/types';
  import { fade } from 'svelte/transition';
  import { deckToUrl } from '$lib/stores/deck';
  import { toasts } from '$lib/stores/toast';
  import ImageMigrationDialog from './ImageMigrationDialog.svelte';
  import { canonUpdateCard } from '$lib/stores/canonUpdate';

  const props = $props();
  const deck = props.deck as Deck;
  const onClose = props.onClose as () => void;

  let dialogElement: HTMLDialogElement;
  let activeTab = $state<'share' | 'backup'>('share');
  let urlSize = $state(0);
  let blobCount = $state(0);
  let missingImageCount = $state(0);
  let migrationNeeded = $state(false);
  let showMigration = $state(false);

  // Browser URL length limits (in bytes)
  const BROWSER_LIMITS = $state({
    'Chrome/Edge': 32_768,
    'Firefox': 65_536,
    'Safari': 80_000,
    'Opera': 32_768,
    'Mobile Safari': 64_000,
    'Mobile Chrome': 32_768
  });

  // Show dialog when mounted
  $effect(() => {
    if (dialogElement && !dialogElement.open) {
      dialogElement.showModal();
    }
  });

  // Calculate URL size and check for blobs when deck changes
  $effect(() => {
    if (deck) {
      urlSize = new TextEncoder().encode(deckToUrl(deck)).length;
      
      // Count cards with no images separately from those needing migration
      missingImageCount = deck.cards.filter((card: Card) => !card.image).length;
      
      // Only count images that need URL migration (local files or blob:local)
      blobCount = deck.cards.filter((card: Card) => {
        if (!card.image) return false; // Don't count missing images here
        return card.image === 'blob:local' || (!card.image.includes(':') && !card.image.startsWith('http'));
      }).length;
      migrationNeeded = blobCount > 0;
    }
  });

  // Get browser support status
  function getBrowserSupport(size: number) {
    return Object.entries(BROWSER_LIMITS).map(([browser, limit]) => ({
      browser,
      supported: size <= limit
    }));
  }

  // Get URL size status
  function getUrlSizeStatus(size: number) {
    const minBrowserLimit = Math.min(...Object.values(BROWSER_LIMITS));
    if (size > 30000) return 'error';
    if (size > 25000) return 'warning';
    if (size > minBrowserLimit) return 'warning';
    return 'success';
  }

  function handleClose() {
    dialogElement?.close();
    onClose();
  }

  async function handleShare(format: 'url' | 'json') {
    if (migrationNeeded) {
      toasts.warning('Please migrate blob-based images to URLs first');
      return;
    }

    if (format === 'url') {
      try {
        const shareUrl = deckToUrl(deck);
        await navigator.clipboard.writeText(shareUrl);
        toasts.success('Share URL copied! Send this URL to share your deck.');
      } catch (err) {
        console.error('Failed to copy URL:', err);
        toasts.error('Failed to copy URL to clipboard');
      }
    } else {
      try {
        const json = JSON.stringify(deck, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deck.meta.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toasts.success('JSON file downloaded successfully');
      } catch (err) {
        console.error('Failed to download JSON:', err);
        toasts.error('Failed to download JSON file');
      }
    }
  }
</script>

<dialog 
  bind:this={dialogElement}
  class="share-dialog"
  onclose={handleClose}
>
  <div class="dialog-content">
    <div class="dialog-header">
      <h2>Share Deck: {deck.meta.name}</h2>
      <button 
        class="close-button" 
        onclick={handleClose}
      >
        ×
      </button>
    </div>

    <div class="tabs">
      <button 
        class="tab-button" 
        class:active={activeTab === 'share'}
        onclick={() => activeTab = 'share'}
      >
        Share/Export
      </button>
      <button 
        class="tab-button" 
        class:active={activeTab === 'backup'}
        onclick={() => activeTab = 'backup'}
      >
        Complete Backup
      </button>
    </div>

    <div class="tab-content">
      {#if activeTab === 'share'}
        <div class="share-export" transition:fade>
          <div class="info-section">
            <p>Share your deck via URL or export as JSON. Both options require all images to be accessible via URLs.</p>
            
            <div class="url-size">
              <div class="size-info">
                <span class={getUrlSizeStatus(urlSize)}>
                  URL Size: {(urlSize / 1024).toFixed(1)}KB / {(30000 / 1024).toFixed(1)}KB
                </span>
                {#if urlSize > 30000}
                  <span class="error">URL is too large to share</span>
                {:else if urlSize > 25000}
                  <span class="warning">URL is approaching size limit</span>
                {/if}
              </div>
              <div class="browser-support">
                <span class="support-label">Browser Support:</span>
                <div class="browser-list">
                  {#each getBrowserSupport(urlSize) as { browser, supported }}
                    <span class="browser" class:unsupported={!supported}>
                      {#if supported}
                        <span class="checkmark">✓</span>
                      {:else}
                        <span class="cross">×</span>
                      {/if}
                      {browser}
                    </span>
                  {/each}
                </div>
              </div>
            </div>

            {#if migrationNeeded || missingImageCount > 0}
              <div class="notices">
                {#if migrationNeeded}
                  <div class="migration-notice warning">
                    <h3>⚠️ Image Migration Required</h3>
                    <p>{blobCount} image{blobCount === 1 ? '' : 's'} need{blobCount === 1 ? 's' : ''} to be converted to URLs before sharing.</p>
                    <button 
                      class="secondary-button"
                      onclick={() => showMigration = true}
                    >
                      Migrate Images
                    </button>
                  </div>
                {/if}
                {#if missingImageCount > 0}
                  <div class="info-notice">
                    <h3>ℹ️ Missing Images</h3>
                    <p>{missingImageCount} card{missingImageCount === 1 ? '' : 's'} {missingImageCount === 1 ? 'has' : 'have'} no image set. {missingImageCount === 1 ? 'This card' : 'These cards'} can still be shared.</p>
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          <div class="action-buttons">
            <button 
              class="primary-button"
              disabled={migrationNeeded || urlSize > 30000}
              onclick={() => handleShare('url')}
            >
              Copy Share URL
            </button>
            <button 
              class="primary-button"
              disabled={migrationNeeded}
              onclick={() => handleShare('json')}
            >
              Download JSON
            </button>
          </div>
        </div>
      {:else}
        <div class="backup-export" transition:fade>
          <p>Create a complete backup including all images. This file can be used to restore your deck exactly as it is now.</p>
          <button class="primary-button">
            Download Backup (.zip)
          </button>
        </div>
      {/if}
    </div>
  </div>
</dialog>

{#if showMigration}
  <ImageMigrationDialog
    cards={deck.cards}
    onClose={() => showMigration = false}
    onUpdate={async (id: string, updates: Partial<Card>) => {
      await canonUpdateCard(id, updates, ['card-image'], 'Updating image...');
    }}
  />
{/if}

<style>
  .share-dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    background: var(--ui-bg);
    color: var(--ui-text);
    box-shadow: var(--page-shadow);
    width: 480px;
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

  h2 {
    margin: 0;
    font-size: var(--ui-title-size);
    font-family: var(--ui-font-family);
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    font-weight: bold;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    color: var(--ui-text);
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    padding: 0 var(--content-gap);
    border-bottom: 1px solid var(--ui-border);
  }

  .tab-button {
    padding: 0.5rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--ui-text);
    opacity: 0.7;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
  }

  .tab-button:hover {
    opacity: 0.9;
  }

  .tab-button.active {
    opacity: 1;
    border-bottom-color: var(--button-bg);
  }

  .tab-content {
    padding: var(--content-gap);
    min-height: 200px;
    width: 100%;
    box-sizing: border-box;
  }

  .share-export,
  .backup-export {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .url-size {
    margin: 0;
    padding: 0.75rem;
    background: var(--ui-hover-bg);
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .size-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .size-info .success {
    color: var(--toast-success);
  }

  .size-info .warning {
    color: var(--toast-warning);
  }

  .size-info .error {
    color: var(--toast-error);
  }

  .browser-support {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9em;
  }

  .support-label {
    color: var(--ui-muted);
  }

  .browser-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .browser {
    padding: 0.25rem 0.5rem;
    background: var(--ui-bg);
    border: 1px solid var(--ui-border);
    border-radius: 3px;
    font-size: 0.85em;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .browser.unsupported {
    text-decoration: none;
    opacity: 0.7;
  }

  .checkmark {
    color: var(--toast-success);
    font-weight: bold;
  }

  .cross {
    color: var(--toast-error);
    font-weight: bold;
  }

  .warning {
    color: var(--toast-warning);
  }

  .notices {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .migration-notice,
  .info-notice {
    padding: 0.75rem;
    border-radius: 4px;
  }

  .migration-notice {
    border: 1px solid var(--toast-warning);
    background: color-mix(in srgb, var(--toast-warning) 10%, transparent);
  }

  .info-notice {
    border: 1px solid var(--toast-info);
    background: color-mix(in srgb, var(--toast-info) 10%, transparent);
    color: var(--ui-text);
  }

  .migration-notice p,
  .info-notice p {
    margin: 0 0 0.75rem;
    color: inherit;
  }

  .info-notice p {
    margin-bottom: 0;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .primary-button,
  .secondary-button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
    min-height: 36px;
    width: 100%;
    transition: all 0.2s ease;
  }

  .primary-button {
    background: var(--button-bg);
    color: var(--button-text);
    border: 1px solid var(--button-border);
  }

  .primary-button:hover {
    background: var(--button-hover-bg);
  }

  .primary-button:active {
    background: var(--button-active-bg);
  }

  .secondary-button {
    background: transparent;
    color: var(--ui-text);
    border: 1px solid var(--ui-border);
  }

  .secondary-button:hover {
    background: var(--ui-hover-bg);
  }

  .primary-button:disabled,
  .secondary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  p {
    margin: 0 0 1rem;
    color: var(--ui-muted);
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
  }
</style> 