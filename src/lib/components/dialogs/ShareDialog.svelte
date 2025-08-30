<script lang="ts">
  import type { Card, Deck } from '$lib/next/types/deck.js';
  import { fade } from 'svelte/transition';
  import ImageMigrationDialog from './ImageMigrationDialog.svelte';
  import { canonUpdateCard } from '$lib/stores/canonUpdate';
  import {
    initializeShareDialogState,
    calculateDeckStats,
    getBrowserSupport,
    getUrlSizeStatus,
    handleShare,
    BROWSER_LIMITS,
    type ShareDialogState
  } from './ShareDialog.svelte.ts';

  const props = $props();
  const deck = props.deck as Deck;
  const onClose = props.onClose as () => void;

  let dialogElement: HTMLDialogElement;
  let state = $state<ShareDialogState>(initializeShareDialogState());

  // Show dialog when mounted
  $effect(() => {
    if (dialogElement && !dialogElement.open) {
      dialogElement.showModal();
    }
  });

  // Calculate URL size and check for blobs when deck changes
  $effect(() => {
    if (deck) {
      const deckStats = calculateDeckStats(deck);
      state = { ...state, ...deckStats };
    }
  });

  function handleClose() {
    dialogElement?.close();
    onClose();
  }

  async function handleShareAction(format: 'url' | 'json') {
    await handleShare(deck, format, state.migrationNeeded);
  }
</script>

<dialog 
  bind:this={dialogElement}
  class="share-dialog"
  onclose={handleClose}
>
  <div class="dialog-content">
    <div class="dialog-header">
      <h2>Share Deck: {deck.meta.title}</h2>
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
        class:active={state.activeTab === 'share'}
        onclick={() => state = { ...state, activeTab: 'share' }}
      >
        Share/Export
      </button>
      <button 
        class="tab-button" 
        class:active={state.activeTab === 'backup'}
        onclick={() => state = { ...state, activeTab: 'backup' }}
      >
        Complete Backup
      </button>
    </div>

    <div class="tab-content">
      {#if state.activeTab === 'share'}
        <div class="share-export" transition:fade>
          <div class="info-section">
            <p>Share your deck via URL or export as JSON. Both options require all images to be accessible via URLs.</p>
            
            <div class="url-size">
              <div class="size-info">
                <span class={getUrlSizeStatus(state.urlSize)}>
                  URL Size: {(state.urlSize / 1024).toFixed(1)}KB / {(30000 / 1024).toFixed(1)}KB
                </span>
                {#if state.urlSize > 30000}
                  <span class="error">URL is too large to share</span>
                {:else if state.urlSize > 25000}
                  <span class="warning">URL is approaching size limit</span>
                {/if}
              </div>
              <div class="browser-support">
                <span class="support-label">Browser Support:</span>
                <div class="browser-list">
                  {#each getBrowserSupport(state.urlSize) as { browser, supported }}
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

            {#if state.migrationNeeded || state.missingImageCount > 0}
              <div class="notices">
                {#if state.migrationNeeded}
                  <div class="migration-notice warning">
                    <h3>⚠️ Image Migration Required</h3>
                    <p>{state.blobCount} image{state.blobCount === 1 ? '' : 's'} need{state.blobCount === 1 ? 's' : ''} to be converted to URLs before sharing.</p>
                    <button 
                      class="secondary-button"
                      onclick={() => state = { ...state, showMigration: true }}
                    >
                      Migrate Images
                    </button>
                  </div>
                {/if}
                {#if state.missingImageCount > 0}
                  <div class="info-notice">
                    <h3>ℹ️ Missing Images</h3>
                    <p>{state.missingImageCount} card{state.missingImageCount === 1 ? '' : 's'} {state.missingImageCount === 1 ? 'has' : 'have'} no image set. {state.missingImageCount === 1 ? 'This card' : 'These cards'} can still be shared.</p>
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          <div class="action-buttons">
            <button 
              class="primary-button"
              disabled={state.migrationNeeded || state.urlSize > 30000}
              onclick={() => handleShareAction('url')}
            >
              Copy Share URL
            </button>
            <button 
              class="primary-button"
              disabled={state.migrationNeeded}
              onclick={() => handleShareAction('json')}
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

{#if state.showMigration}
  <ImageMigrationDialog
    cards={deck.cards}
    onClose={() => state = { ...state, showMigration: false }}
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