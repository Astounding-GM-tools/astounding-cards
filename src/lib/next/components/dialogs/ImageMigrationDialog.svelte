<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import type { Deck } from '$lib/next/types/deck.js';
    
    interface Props {
        deck: Deck;
    }
    
    const { deck }: Props = $props();
    
    // Local state
    let isMigrating = $state(false);
    let error = $state<string | null>(null);
    let migrationProgress = $state(0);
    let migrationComplete = $state(false);
    let imageUrls = $state<Record<string, string>>({});
    let migrationMode = $state<'urls' | 'upload'>('urls');
    
    // Find cards with blob images
    let cardsWithImages = $derived(
        deck.cards.filter(card => 
            card.image && typeof card.image === 'object' && card.image instanceof Blob
        )
    );
    
    let totalImages = $derived(cardsWithImages.length);
    let migratedImages = $derived(Object.keys(imageUrls).length);
    let canProceed = $derived(migratedImages === totalImages);
    
    function setImageUrl(cardId: string, url: string) {
        imageUrls[cardId] = url.trim();
    }
    
    async function uploadImages() {
        // TODO: Implement image upload to a service
        isMigrating = true;
        error = null;
        
        try {
            for (let i = 0; i < cardsWithImages.length; i++) {
                const card = cardsWithImages[i];
                migrationProgress = i + 1;
                
                // Simulate upload delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // TODO: Actually upload the blob to an image hosting service
                const fakeUploadedUrl = `https://example.com/images/${card.id}.jpg`;
                imageUrls[card.id] = fakeUploadedUrl;
            }
            
            migrationComplete = true;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to upload images';
        } finally {
            isMigrating = false;
        }
    }
    
    async function applyMigration() {
        // TODO: Apply the URL mappings to the deck
        console.log('Applying image migration:', imageUrls);
        
        // For now, just close the dialog
        dialogStore.close();
    }
    
    function getImagePreview(blob: Blob): string {
        return URL.createObjectURL(blob);
    }
</script>

<div class="image-migration-dialog">
    <div class="dialog-header">
        <h2>🖼️ Convert Images</h2>
        <button class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        <div class="migration-info">
            <h3>Image Migration Required</h3>
            <p>Your deck contains {totalImages} image{totalImages !== 1 ? 's' : ''} that need to be converted to URLs for sharing.</p>
        </div>
        
        <!-- Migration method selection -->
        <div class="migration-methods">
            <h4>Migration Method</h4>
            <div class="method-tabs">
                <button 
                    class="method-tab" 
                    class:active={migrationMode === 'urls'}
                    onclick={() => migrationMode = 'urls'}
                >
                    🔗 Provide URLs
                </button>
                <button 
                    class="method-tab" 
                    class:active={migrationMode === 'upload'}
                    onclick={() => migrationMode = 'upload'}
                >
                    ☁️ Upload Images
                </button>
            </div>
        </div>
        
        {#if migrationMode === 'urls'}
            <div class="url-migration">
                <div class="images-list">
                    {#each cardsWithImages as card (card.id)}
                        <div class="image-item">
                            <div class="image-preview">
                                <img 
                                    src={getImagePreview(card.image)} 
                                    alt="Card {card.title}" 
                                    class="preview-img"
                                />
                            </div>
                            <div class="image-info">
                                <h5>{card.title}</h5>
                                <div class="url-input-group">
                                    <label for="url-{card.id}">Image URL:</label>
                                    <input 
                                        id="url-{card.id}"
                                        type="url" 
                                        placeholder="https://example.com/image.jpg"
                                        value={imageUrls[card.id] || ''}
                                        oninput={(e) => setImageUrl(card.id, e.target.value)}
                                        class="url-input"
                                    />
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
            <div class="upload-migration">
                {#if !isMigrating && !migrationComplete}
                    <div class="upload-info">
                        <p>Click below to upload all images to a hosting service. This will generate URLs automatically.</p>
                        <button class="action-button primary" onclick={uploadImages}>
                            🚀 Upload All Images
                        </button>
                    </div>
                {:else if isMigrating}
                    <div class="upload-progress">
                        <h4>Uploading Images...</h4>
                        <div class="progress-bar">
                            <div 
                                class="progress-fill" 
                                style="width: {(migrationProgress / totalImages) * 100}%"
                            ></div>
                        </div>
                        <p>Progress: {migrationProgress} / {totalImages} images uploaded</p>
                    </div>
                {:else if migrationComplete}
                    <div class="upload-complete">
                        <h4>✅ Upload Complete</h4>
                        <p>All images have been uploaded successfully and URLs have been generated.</p>
                        <div class="uploaded-urls">
                            {#each cardsWithImages as card (card.id)}
                                <div class="uploaded-item">
                                    <span class="card-name">{card.title}:</span>
                                    <code class="generated-url">{imageUrls[card.id]}</code>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
        
        {#if error}
            <div class="error">{error}</div>
        {/if}
        
        <!-- Progress indicator for URL method -->
        {#if migrationMode === 'urls'}
            <div class="url-progress">
                <div class="progress-bar">
                    <div 
                        class="progress-fill" 
                        style="width: {(migratedImages / totalImages) * 100}%"
                    ></div>
                </div>
                <p>URLs provided: {migratedImages} / {totalImages}</p>
            </div>
        {/if}
        
        <!-- Actions -->
        <div class="migration-actions">
            <button 
                class="action-button secondary"
                onclick={() => dialogStore.close()}
                disabled={isMigrating}
            >
                Cancel
            </button>
            <button 
                class="action-button primary"
                onclick={applyMigration}
                disabled={!canProceed || isMigrating}
            >
                {isMigrating ? 'Processing...' : 'Apply Changes'}
            </button>
        </div>
    </div>
</div>

<style>
    .image-migration-dialog {
        background: white;
        border-radius: 8px;
        max-width: 700px;
        width: 90vw;
        max-height: 85vh;
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
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .migration-info h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .migration-info p {
        margin: 0;
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
    }
    
    .migration-methods h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 500;
    }
    
    .method-tabs {
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .method-tab {
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }
    
    .method-tab:hover {
        color: var(--ui-text, #1a202c);
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .method-tab.active {
        color: var(--button-primary-bg, #3b82f6);
        border-bottom-color: var(--button-primary-bg, #3b82f6);
    }
    
    .images-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .image-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        align-items: flex-start;
    }
    
    .image-preview {
        flex-shrink: 0;
        width: 80px;
        height: 80px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--ui-hover-bg, #f8fafc);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .preview-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .image-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .image-info h5 {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
    }
    
    .url-input-group label {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--ui-text, #1a202c);
    }
    
    .url-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: monospace;
    }
    
    .url-input:focus {
        outline: none;
        border-color: var(--button-primary-bg, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .upload-info {
        text-align: center;
        padding: 2rem;
    }
    
    .upload-info p {
        margin: 0 0 1.5rem 0;
        color: var(--ui-text, #1a202c);
    }
    
    .upload-progress {
        text-align: center;
    }
    
    .upload-progress h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 500;
    }
    
    .upload-complete h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 500;
        color: var(--button-primary-bg, #3b82f6);
    }
    
    .upload-complete p {
        margin: 0 0 1rem 0;
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
    }
    
    .uploaded-urls {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .uploaded-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
    }
    
    .card-name {
        font-weight: 500;
        min-width: 100px;
    }
    
    .generated-url {
        background: var(--ui-hover-bg, #f8fafc);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.75rem;
        flex: 1;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    
    .url-progress,
    .progress-bar {
        margin-bottom: 1rem;
    }
    
    .progress-bar {
        width: 100%;
        height: 8px;
        background: var(--ui-border, #e2e8f0);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }
    
    .progress-fill {
        height: 100%;
        background: var(--button-primary-bg, #3b82f6);
        transition: width 0.3s ease;
    }
    
    .url-progress p,
    .upload-progress p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
        text-align: center;
    }
    
    .migration-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid var(--ui-border, #e2e8f0);
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
    
    .action-button:hover:not(:disabled) {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .action-button.primary {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
        border-color: var(--button-primary-bg, #3b82f6);
    }
    
    .action-button.primary:hover:not(:disabled) {
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
    
    @media (max-width: 640px) {
        .image-item {
            flex-direction: column;
            text-align: center;
        }
        
        .migration-actions {
            flex-direction: column;
        }
        
        .uploaded-item {
            flex-direction: column;
            align-items: stretch;
            gap: 0.25rem;
        }
    }
</style>
