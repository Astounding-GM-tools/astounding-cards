<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import { toasts } from '$lib/stores/toast.js';
    import { nextDb } from '$lib/next/stores/database.js';
    import type { Deck } from '$lib/next/types/deck.js';
    import ImageMigrationDialog from './ImageMigrationDialog.svelte';
    import { generateShareUrl as createShareUrl } from '$lib/next/utils/shareUrlUtils.js';
    
    interface Props {
        deck: Deck;
    }
    
    const { deck }: Props = $props();
    
    // Local state
    let isGenerating = $state(false);
    let shareUrl = $state<string | null>(null);
    let error = $state<string | null>(null);
    let needsImageMigration = $state(false);
    let showImageMigration = $state(false);
    
    // Check if deck has images that need migration
    function checkImageMigrationNeeded() {
        needsImageMigration = deck.cards.some(card => {
            // Skip cards with no images entirely (they're fine as-is)
            if (!card.image && !card.imageBlob) {
                return false; // Card has no image, no migration needed
            }
            
            // If card has a valid external URL, it's already shareable - no migration needed
            // even if it also has a blob (the URL takes precedence for sharing)
            if (card.image && isValidExternalUrl(card.image)) {
                return false; // Valid external URL exists, skip migration
            }
            
            // Need migration if:
            // 1. Has blob but no valid external URL
            // 2. Has image URL that's not a valid external URL
            return (
                card.imageBlob || 
                (card.image && !isValidExternalUrl(card.image))
            );
        });
    }
    
    function isValidExternalUrl(url?: string | null): boolean {
        if (!url) return false;
        try {
            const parsedUrl = new URL(url);
            return (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') && 
                   parsedUrl.hostname !== 'localhost' && 
                   parsedUrl.hostname !== '127.0.0.1' &&
                   !parsedUrl.protocol.startsWith('blob:') &&
                   !parsedUrl.protocol.startsWith('data:');
        } catch {
            return false;
        }
    }
    
    // Initialize check
    $effect(() => {
        checkImageMigrationNeeded();
    });
    
    async function generateShareUrl() {
        isGenerating = true;
        error = null;
        
        try {
            // IMPORTANT: Fetch fresh deck data from database to ensure we have
            // the latest image URLs (in case images were just migrated)
            const freshDeck = await nextDb.getDeck(deck.id);
            
            if (!freshDeck) {
                throw new Error('Deck not found in database');
            }
            
            console.log('[ShareURL] Generating from fresh deck');
            console.log('[ShareURL] First card image:', freshDeck.cards[0]?.image);
            
            // Generate share URL with hash format using fresh data
            shareUrl = createShareUrl(freshDeck);
            toasts.success('Share URL generated!');
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to generate share URL';
            toasts.error('Failed to generate share URL');
            console.error('[ShareURL] Generation error:', err);
        } finally {
            isGenerating = false;
        }
    }
    
    async function copyToClipboard() {
        if (!shareUrl) return;
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            toasts.success('Share URL copied to clipboard!');
        } catch (err) {
            toasts.error('Failed to copy URL to clipboard');
            console.error('Clipboard error:', err);
        }
    }
    
    function handleImageMigration() {
        showImageMigration = true;
    }
    
    async function handleMigrationComplete(migrationData: Record<string, { url: string; metadata: any }>) {
        try {
            // Prepare card updates for the next database system
            const cardUpdates = Object.entries(migrationData).map(([cardId, migration]) => ({
                cardId,
                updates: {
                    image: migration.url,
                    imageBlob: null, // Remove blob since we now have URL
                    imageMetadata: migration.metadata
                }
            }));
            
            console.log('[Migration] Updating cards:', cardUpdates);
            
            // Use the next database system to update multiple cards atomically
            const updatedDeck = await nextDb.updateMultipleCards(deck.id, cardUpdates);
            
            console.log('[Migration] Updated deck:', updatedDeck);
            console.log('[Migration] First card image:', updatedDeck.cards[0]?.image);
            
            // IMPORTANT: Update the deck store if this is the active deck
            // This ensures the current editing session has the new image URLs
            const currentDeck = nextDeckStore.deck;
            if (currentDeck && currentDeck.id === updatedDeck.id) {
                console.log('[Migration] Reloading deck in store');
                await nextDeckStore.loadDeck(updatedDeck.id);
            }
            
            toasts.success('Images migrated successfully!');
            
            // Hide the migration dialog immediately
            showImageMigration = false;
            
            // Import ShareUrlDialog component to reopen with updated deck
            const { ShareUrlDialog } = await import('./index.js');
            
            // Close current dialog and reopen ShareUrlDialog with updated deck
            dialogStore.close();
            // Reopen the ShareUrlDialog after a brief delay to allow current dialog to close
            setTimeout(() => {
                dialogStore.setContent(ShareUrlDialog, { deck: updatedDeck });
            }, 100);
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save migrated deck';
            toasts.error(`Migration failed: ${errorMessage}`);
            console.error('Migration error:', err);
        }
    }
</script>

{#if !showImageMigration}
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
        
        {#if needsImageMigration}
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
                                data-testid="share-url-input"
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
{/if}

{#if showImageMigration}
    <ImageMigrationDialog 
        deck={deck} 
        onMigrationComplete={handleMigrationComplete}
    />
{/if}

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
