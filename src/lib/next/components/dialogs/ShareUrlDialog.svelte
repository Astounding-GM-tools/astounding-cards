<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import type { Deck } from '$lib/next/types/deck.js';
    
    interface Props {
        deck: Deck;
    }
    
    const { deck }: Props = $props();
    
    // Local state
    let isGenerating = $state(false);
    let shareUrl = $state<string | null>(null);
    let error = $state<string | null>(null);
    let hasBlobImages = $state(false);
    let showImageMigration = $state(false);
    
    // Check if deck has images that need migration
    $effect(() => {
        hasBlobImages = deck.cards.some(card => 
            card.image && typeof card.image === 'object' && card.image instanceof Blob
        );
    });
    
    async function generateShareUrl() {
        isGenerating = true;
        error = null;
        
        try {
            // TODO: Implement URL generation logic
            // This will validate deck (no blobs), create shareable URL
            shareUrl = 'https://example.com/share/deck-id-placeholder';
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to generate share URL';
        } finally {
            isGenerating = false;
        }
    }
    
    function copyToClipboard() {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            // TODO: Show toast notification
        }
    }
    
    function handleImageMigration() {
        showImageMigration = true;
        // TODO: Open ImageMigrationDialog
    }
</script>

<div class="share-url-dialog">
    <div class="dialog-header">
        <h2>🔗 Share Deck</h2>
        <button class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        <div class="deck-info">
            <h3>{deck.meta.title}</h3>
            <p>{deck.cards.length} cards</p>
        </div>
        
        {#if hasBlobImages}
            <div class="warning-section">
                <div class="warning">
                    <h4>⚠️ Images Need Migration</h4>
                    <p>This deck contains images that need to be converted to URLs before sharing.</p>
                    <button class="action-button primary" onclick={handleImageMigration}>
                        Convert Images
                    </button>
                </div>
            </div>
        {:else}
            <div class="share-section">
                {#if shareUrl}
                    <div class="url-result">
                        <label for="share-url">Share URL:</label>
                        <div class="url-input-group">
                            <input 
                                id="share-url"
                                type="text" 
                                value={shareUrl} 
                                readonly 
                                class="share-url-input"
                            />
                            <button class="copy-button" onclick={copyToClipboard}>
                                📋 Copy
                            </button>
                        </div>
                        <p class="url-note">Anyone with this URL can import your deck.</p>
                    </div>
                {:else}
                    <div class="generate-section">
                        <p>Generate a shareable URL for this deck.</p>
                        <button 
                            class="action-button primary" 
                            onclick={generateShareUrl}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'Generating...' : 'Generate Share URL'}
                        </button>
                    </div>
                {/if}
            </div>
        {/if}
        
        {#if error}
            <div class="error">{error}</div>
        {/if}
    </div>
</div>

<style>
    .share-url-dialog {
        background: white;
        border-radius: 8px;
        max-width: 500px;
        width: 90vw;
        display: flex;
        flex-direction: column;
    }
    
    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .dialog-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem;
        color: var(--ui-muted, #64748b);
        border-radius: 4px;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .close-button:hover {
        background: var(--ui-hover-bg, #f8fafc);
        color: var(--ui-text, #1a202c);
    }
    
    .dialog-content {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .deck-info h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .deck-info p {
        margin: 0;
        color: var(--ui-muted, #64748b);
        font-size: 0.875rem;
    }
    
    .warning-section .warning {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
        border: 1px solid #fbbf24;
        border-radius: 6px;
        padding: 1rem;
    }
    
    .warning h4 {
        margin: 0 0 0.5rem 0;
        color: #92400e;
        font-size: 1rem;
    }
    
    .warning p {
        margin: 0 0 1rem 0;
        color: #78350f;
        font-size: 0.875rem;
    }
    
    .share-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .generate-section {
        text-align: center;
    }
    
    .generate-section p {
        margin: 0 0 1rem 0;
        color: var(--ui-text, #1a202c);
    }
    
    .url-result label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
    }
    
    .url-input-group {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .share-url-input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: monospace;
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .copy-button {
        padding: 0.75rem 1rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
    }
    
    .copy-button:hover {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .url-note {
        margin: 0;
        color: var(--ui-muted, #64748b);
        font-size: 0.75rem;
        font-style: italic;
    }
    
    .action-button {
        padding: 0.75rem 1rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
    }
    
    .action-button:hover {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .action-button.primary {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
        border-color: var(--button-primary-bg, #3b82f6);
    }
    
    .action-button.primary:hover {
        background: var(--button-primary-hover-bg, #2563eb);
    }
    
    .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .error {
        color: var(--toast-error, #dc2626);
        font-size: 0.875rem;
        text-align: center;
        padding: 0.75rem;
        background: rgba(220, 38, 38, 0.1);
        border-radius: 4px;
    }
</style>
