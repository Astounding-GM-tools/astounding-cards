<!--
    Card Edit Dialog - The Revolutionary Editing Experience!
    
    This replaces all contentEditable interactions with a clean,
    focused editing interface that updates cards via the Canon Update Pattern.
    
    Features:
    - Live preview of changes
    - Organized sections for different card properties
    - Save/Cancel workflow
    - No more contentEditable complexity!
-->
<script lang="ts">
    import type { Card } from '$lib/next/types/card.js';
    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    
    // Import actual card components
    import CardComponent from '../card/Card.svelte';
    import Header from '../header/Header.svelte';
    import StatFocus from '../stats/StatFocus.svelte';
    import StatBlock from '../stats/StatBlock.svelte';
    import TraitList from '../traits/TraitList.svelte';
    import CardImage from '../image/CardImage.svelte';
    import InlineImageSelector from '../image/InlineImageSelector.svelte';
    
    import type { Trait, Stat } from '$lib/next/types/card.js';
    import { ImageUrlManager } from '$lib/utils/image-handler.js';
    
    // Props passed when dialog opens
    const { cardId }: { cardId: string } = $props();
    
    // Get the card from store
    let card = $derived(nextDeckStore.getCard(cardId));
    
    // Working state for form (unsaved changes)
    let formData = $state({
        title: '',
        subtitle: '',
        description: '',
        stats: [] as Stat[],
        traits: [] as Trait[],
        imageBlob: null as Blob | null,
        imageUrl: null as string | null,
        imageMetadata: null as Card['imageMetadata'] | null
    });
    
    // Image URL manager for blob handling
    let imageUrlManager = $state(new ImageUrlManager());
    
    // Current image preview URL - show image state when blob OR url exists
    let currentImageUrl = $derived(imageUrlManager.url || formData.imageUrl);
    let hasImage = $derived(!!(formData.imageBlob || formData.imageUrl));
    
    
    // Create preview card with live form data
    let previewCard = $derived(card ? {
        ...card,
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        stats: formData.stats,
        traits: formData.traits,
        imageBlob: formData.imageBlob,
        image: formData.imageUrl
    } : null);
    
    
    // Update form when card changes
    $effect(() => {
        if (card) {
            formData.title = card.title;
            formData.subtitle = card.subtitle;
            formData.description = card.description;
            formData.stats = card.stats || [];
            formData.traits = card.traits || [];
            formData.imageBlob = card.imageBlob || null;
            formData.imageUrl = card.image || null;
            formData.imageMetadata = card.imageMetadata || null;
            
            // Update image manager
            imageUrlManager.updateBlob(card.imageBlob);
        }
    });
    
    // Image handling functions
    async function handleImageChange(blob: Blob | null, sourceUrl?: string, originalFileName?: string) {
        formData.imageBlob = blob;
        formData.imageUrl = sourceUrl || null;
        
        // Update metadata when new image is added
        if (blob || sourceUrl) {
            formData.imageMetadata = {
                originalName: originalFileName || getFilenameFromUrl(sourceUrl) || 'image',
                addedAt: Date.now(),
                source: sourceUrl ? 'url' : 'upload',
                size: blob?.size
            };
        } else {
            formData.imageMetadata = null;
        }
        
        // Update image manager
        imageUrlManager.updateBlob(blob);
    }
    
    function removeImage() {
        formData.imageBlob = null;
        formData.imageUrl = null;
        formData.imageMetadata = null;
        imageUrlManager.updateBlob(null);
    }
    
    // Cleanup on destroy
    $effect(() => {
        return () => {
            imageUrlManager.destroy();
        };
    });
    
    let isSaving = $state(false);
    let hasChanges = $state(false);
    
    // Check for changes
    $effect(() => {
        if (card) {
            hasChanges = 
                formData.title !== card.title ||
                formData.subtitle !== card.subtitle ||
                formData.description !== card.description ||
                JSON.stringify(formData.stats) !== JSON.stringify(card.stats) ||
                JSON.stringify(formData.traits) !== JSON.stringify(card.traits) ||
                formData.imageBlob !== (card.imageBlob || null) ||
                formData.imageUrl !== (card.image || null) ||
                JSON.stringify(formData.imageMetadata) !== JSON.stringify(card.imageMetadata || null);
        }
    });
    
    async function saveChanges() {
        if (!card || !hasChanges) return;
        
        isSaving = true;
        const success = await nextDeckStore.updateCard(card.id, {
            title: formData.title,
            subtitle: formData.subtitle,
            description: formData.description,
            stats: formData.stats,
            traits: formData.traits,
            image: formData.imageUrl,
            imageBlob: formData.imageBlob,
            imageMetadata: formData.imageMetadata
        }, 'Saving card changes...');
        
        if (success) {
            dialogStore.close();
        }
        isSaving = false;
    }
    
    function cancelChanges() {
        dialogStore.close();
    }
    
    function resetForm() {
        if (card) {
            formData.title = card.title;
            formData.subtitle = card.subtitle;
            formData.description = card.description;
        }
    }
    
    // Helper functions for image info
    function getImageDisplayInfo() {
        // Check both saved card data and current form changes
        const hasCardImageData = !!(card?.imageBlob || card?.image);
        const hasFormImageData = !!(formData.imageBlob || formData.imageUrl);
        
        // More robust change detection - handle null vs undefined properly
        const cardImageBlob = card?.imageBlob || null;
        const cardImageUrl = card?.image || null;
        const cardImageMetadata = card?.imageMetadata || null;
        
        const hasImageChanges = 
            formData.imageBlob !== cardImageBlob ||
            formData.imageUrl !== cardImageUrl ||
            JSON.stringify(formData.imageMetadata) !== JSON.stringify(cardImageMetadata);
        
        // No image case
        if (!hasCardImageData && !hasFormImageData) {
            return {
                filename: 'No image added',
                source: '',
                timestamp: null,
                status: 'add-image',
                message: 'Add an image to enhance your card! 📸'
            };
        }
        
        // Has image - determine status based on whether changes are saved
        let filename = '';
        let source = '';
        let timestamp = null;
        let status = hasImageChanges ? 'ready-to-save' : 'ok';
        
        // Use form data if we have changes, otherwise use card data
        const imageMetadata = hasImageChanges ? formData.imageMetadata : card?.imageMetadata;
        const imageUrl = hasImageChanges ? formData.imageUrl : card?.image;
        const imageBlob = hasImageChanges ? formData.imageBlob : card?.imageBlob;
        
        // Use metadata if available (new images with proper metadata)
        if (imageMetadata?.originalName) {
            filename = imageMetadata.originalName;
            source = imageMetadata.source === 'url' ? 'downloaded' : 'uploaded';
            timestamp = new Date(imageMetadata.addedAt!);
        }
        // URL reference available (downloaded images)
        else if (imageUrl) {
            const urlFilename = getFilenameFromUrl(imageUrl);
            filename = urlFilename || imageUrl.substring(0, 40) + '...';
            source = `Using: ${imageUrl}`;
            timestamp = null;
        }
        // Local blob only (uploaded images without metadata)
        else if (imageBlob) {
            filename = 'Uploaded file';
            source = 'Using: local file';
            timestamp = null;
        }
        
        return {
            filename,
            source,
            timestamp,
            status,
            message: null
        };
    }
    
    function getFilenameFromUrl(url?: string | null): string | null {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            const filename = urlObj.pathname.split('/').pop() || '';
            return filename.includes('.') ? filename : null;
        } catch {
            return null;
        }
    }
</script>

{#if card}
    <div class="card-edit-dialog">
        <div class="dialog-content">
            <!-- Edit Form Section -->
            <section class="edit-section">
                <fieldset class="form-fieldset">
                    <legend>Basic Info</legend>
                    <input 
                        type="text" 
                        bind:value={formData.title}
                        placeholder="Card title"
                        maxlength="100"
                    />
                    <input 
                        type="text" 
                        bind:value={formData.subtitle}
                        placeholder="Subtitle (e.g., Character, Item)"
                        maxlength="50"
                    />
                    <textarea 
                        bind:value={formData.description}
                        placeholder="Description"
                        rows="2"
                        maxlength="500"
                    ></textarea>
                </fieldset>
                
                <!-- Image Section -->
                <fieldset class="form-fieldset">
                    <legend>Image</legend>
                    <InlineImageSelector
                        cardSize="tarot"
                        hasExistingImage={hasImage}
                        existingImageInfo={(() => {
                            const info = getImageDisplayInfo();
                            return {
                                filename: info.filename,
                                source: info.source,
                                timestamp: info.timestamp,
                                status: info.status,
                                message: info.message
                            };
                        })()}
                        onImageChange={handleImageChange}
                        onRemoveImage={removeImage}
                    />
                </fieldset>
                
                <!-- Stats Section -->
                <fieldset class="form-fieldset">
                    <legend>Stats</legend>
                    {#each formData.stats as stat, index}
                        <div class="inline-attribute-editor">
                            <!-- Line 1: title + public -->
                            <div class="attribute-row">
                                <input 
                                    type="text" 
                                    bind:value={stat.title}
                                    placeholder="Stat title"
                                    class="title-input"
                                />
                                <label class="checkbox-label">
                                    <input type="checkbox" bind:checked={stat.isPublic} />
                                    Public
                                </label>
                            </div>
                            
                            <!-- Line 2: value + tracked (stat mode only) -->
                            <div class="attribute-row">
                                <input 
                                    type="number" 
                                    bind:value={stat.value}
                                    placeholder="Value"
                                    class="value-input"
                                    min="0"
                                    max="999"
                                    oninput={(e) => {
                                        const num = parseInt(e.target.value) || 0;
                                        stat.value = Math.max(0, Math.min(999, num));
                                    }}
                                />
                                <label class="checkbox-label">
                                    <input type="checkbox" bind:checked={stat.tracked} />
                                    Tracked
                                </label>
                            </div>
                            
                            <!-- Line 3: description -->
                            <div class="attribute-row">
                                <textarea 
                                    bind:value={stat.description}
                                    placeholder="Optional description"
                                    class="description-input"
                                    rows="1"
                                ></textarea>
                                <button 
                                    class="delete-btn"
                                    onclick={() => formData.stats.splice(index, 1)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    {/each}
                    <button 
                        class="add-attribute-btn"
                        onclick={() => formData.stats.push({ title: '', isPublic: true, value: 0, tracked: false, description: '' })}
                    >
                        + Add Stat
                    </button>
                </fieldset>
                
                <!-- Traits Section -->
                <fieldset class="form-fieldset">
                    <legend>Traits</legend>
                    {#each formData.traits as trait, index}
                        <div class="inline-attribute-editor">
                            <!-- Line 1: title + public -->
                            <div class="attribute-row">
                                <input 
                                    type="text" 
                                    bind:value={trait.title}
                                    placeholder="Trait title"
                                    class="title-input"
                                />
                                <label class="checkbox-label">
                                    <input type="checkbox" bind:checked={trait.isPublic} />
                                    Public
                                </label>
                            </div>
                            
                            <!-- Line 3: description (no line 2 for traits) -->
                            <div class="attribute-row">
                                <textarea 
                                    bind:value={trait.description}
                                    placeholder="Description"
                                    class="description-input"
                                    rows="1"
                                    required
                                ></textarea>
                                <button 
                                    class="delete-btn"
                                    onclick={() => formData.traits.splice(index, 1)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    {/each}
                    <button 
                        class="add-attribute-btn"
                        onclick={() => formData.traits.push({ title: '', isPublic: true, description: '' })}
                    >
                        + Add Trait
                    </button>
                </fieldset>
            </section>
            
            <!-- Live Preview Section -->
            <section class="preview-section">
                {#if previewCard}
                    <div class="preview-container" data-layout="poker">
                        <!-- Front Card Preview -->
                        <div class="preview-wrapper">
                            <CardComponent>
                                <CardImage card={previewCard} />
                                <Header 
                                    title={previewCard.title} 
                                    subtitle={previewCard.subtitle} 
                                />
                                <StatFocus stats={previewCard.stats} />
                                <TraitList traits={previewCard.traits.filter(trait => trait.isPublic)} />
                            </CardComponent>
                            <div class="card-label">Front</div>
                        </div>
                        
                        <!-- Back Card Preview -->
                        <div class="preview-wrapper">
                            <CardComponent>
                                <Header 
                                    back
                                    title={previewCard.title} 
                                    subtitle={previewCard.description} 
                                />
                                <StatBlock stats={previewCard.stats} />
                                <TraitList traits={previewCard.traits.filter(trait => !trait.isPublic)} />
                            </CardComponent>
                            <div class="card-label">Back</div>
                        </div>
                    </div>
                {/if}
            </section>
        </div>
        
        <footer class="dialog-footer">
            <div class="dialog-status">
                {#if isSaving}
                    <span class="saving">💾 Saving...</span>
                {:else if hasChanges}
                    <span class="changes">✏️ Unsaved changes</span>
                {:else}
                    <span class="saved">✅ All changes saved</span>
                {/if}
            </div>
            
            <div class="dialog-actions">
                <button onclick={resetForm} disabled={!hasChanges || isSaving}>
                    Reset
                </button>
                <button onclick={cancelChanges} disabled={isSaving}>
                    Cancel
                </button>
                <button 
                    class="primary" 
                    onclick={saveChanges} 
                    disabled={!hasChanges || isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </footer>
    </div>
{:else}
    <div class="card-edit-dialog">
        <div class="error">
            <h2>Card Not Found</h2>
            <p>The card you're trying to edit could not be found.</p>
            <button onclick={cancelChanges}>Close</button>
        </div>
    </div>
{/if}

<style>
    .card-edit-dialog {
        display: flex;
        flex-direction: column;
        height: 90vh;
        width: 100%;
        max-width: 1000px;
        font-family: var(--font-body);
    }
    
    .dialog-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1rem;
        flex: 1;
        overflow: hidden;
        padding: 0.75rem;
    }
    
    .edit-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        overflow-y: auto;
        padding-right: 0.5rem;
    }
    
    /* Fieldset Form Styles */
    .form-fieldset {
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 0.75rem;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .form-fieldset legend {
        font-weight: 600;
        color: var(--color);
        font-size: 0.85rem;
        padding: 0 0.5rem;
    }
    
    .form-fieldset input,
    .form-fieldset textarea {
        width: 100%;
        padding: 0.4rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-family: var(--font-body);
        font-size: 0.9rem;
        resize: vertical;
    }
    
    .form-fieldset input:focus,
    .form-fieldset textarea:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 2px rgba(74, 85, 104, 0.1);
    }
    
    .coming-soon {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 0.5rem;
        font-size: 0.8rem;
    }
    
    .coming-soon p {
        margin: 0 0 0.25rem 0;
        color: var(--accent);
    }
    
    .coming-soon ul {
        margin: 0;
        padding-left: 1.25rem;
    }
    
    .coming-soon li {
        color: var(--color);
        margin-bottom: 0.125rem;
    }
    
    /* Attribute List Styles */
    .attribute-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .attribute-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border: 1px solid #eee;
        border-radius: 3px;
        background: #fafafa;
    }
    
    .attribute-summary {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        min-width: 0;
    }
    
    .attribute-title {
        font-weight: 600;
        font-size: 0.85rem;
        color: var(--color);
    }
    
    .attribute-value {
        font-size: 0.8rem;
        color: var(--accent);
        font-weight: 500;
    }
    
    .attribute-description {
        font-size: 0.75rem;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .attribute-meta {
        font-size: 0.7rem;
        color: #999;
    }
    
    .edit-attribute-btn {
        padding: 0.25rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-family: var(--font-body);
        font-size: 0.75rem;
        flex-shrink: 0;
    }
    
    .edit-attribute-btn:hover {
        background: #f5f5f5;
    }
    
    .add-attribute-btn {
        padding: 0.5rem;
        border: 1px dashed #ccc;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-family: var(--font-body);
        font-size: 0.8rem;
        color: #666;
        text-align: center;
    }
    
    .add-attribute-btn:hover {
        background: #f9f9f9;
        border-color: var(--accent);
        color: var(--accent);
    }
    
    /* Inline Attribute Editor Styles */
    .inline-attribute-editor {
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 0.5rem;
        background: #fafafa;
        margin-bottom: 0.5rem;
    }
    
    .attribute-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.375rem;
    }
    
    .attribute-row:last-child {
        margin-bottom: 0;
    }
    
    .title-input {
        padding: 0.375rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-family: var(--font-body);
        font-size: 0.85rem;
        min-width: 0;
    }
    
    .value-input {
        width: 80px;
        padding: 0.375rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-family: var(--font-body);
        font-size: 0.85rem;
        text-align: center;
    }
    
    .description-input {
        padding: 0.375rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-family: var(--font-body);
        font-size: 0.85rem;
        resize: vertical;
        min-height: 32px;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.8rem;
        color: #666;
        cursor: pointer;
        white-space: nowrap;
    }
    
    .checkbox-label input[type="checkbox"] {
        margin: 0;
    }
    
    .delete-btn {
        padding: 0.25rem 0.375rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-size: 0.8rem;
        color: #999;
        flex-shrink: 0;
    }
    
    .delete-btn:hover {
        background: #fee;
        border-color: #e74c3c;
        color: #e74c3c;
    }
    
    .title-input:focus,
    .value-input:focus,
    .description-input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 2px rgba(74, 85, 104, 0.1);
    }
    
    /* Preview Section */
    .preview-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .preview-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .preview-wrapper {
        position: relative;
        width: 100%;
        height: 280px; /* Double the height for larger cards */
        overflow: hidden;
    }
    
    /* Scale the actual cards to fit in preview - much larger now */
    .preview-wrapper :global(.card) {
        transform: scale(0.8);
        transform-origin: top center;
        height: 350px; /* Scaled to 0.8 gives us 280px */
        border: 1px solid var(--accent);
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin: 0 auto;
    }
    
    .card-label {
        position: absolute;
        bottom: -1.25rem;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.65rem;
        color: var(--accent);
        font-weight: 500;
    }
    
    /* Footer Styles - More Compact */
    .dialog-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.75rem;
        border-top: 1px solid #eee;
        background: white;
        flex-shrink: 0;
        position: sticky;
        bottom: 0;
        z-index: 10;
    }
    
    .dialog-status {
        font-size: 0.8rem;
    }
    
    .saving {
        color: #ff6b00;
    }
    
    .changes {
        color: #e67e22;
    }
    
    .saved {
        color: #27ae60;
    }
    
    .dialog-actions {
        display: flex;
        gap: 0.375rem;
    }
    
    .dialog-actions button {
        padding: 0.375rem 0.75rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-family: var(--font-body);
        font-size: 0.85rem;
    }
    
    .dialog-actions button:hover:not(:disabled) {
        background: #f5f5f5;
    }
    
    .dialog-actions button.primary {
        background: var(--accent);
        color: white;
        border-color: var(--accent);
    }
    
    .dialog-actions button.primary:hover:not(:disabled) {
        opacity: 0.9;
    }
    
    .dialog-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Error State */
    .error {
        text-align: center;
        padding: 2rem;
    }
    
    .error h2 {
        color: #e74c3c;
        margin-bottom: 1rem;
    }
    
    .error button {
        background: var(--accent);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
    }
    
    /* Image Section Styles */
    .image-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .image-status {
        padding: 0.25rem 0.5rem;
        background: #f8f9fa;
        border-radius: 3px;
        border: 1px solid #e9ecef;
        font-size: 0.75rem;
        color: #666;
        text-align: center;
    }
    
    .current-image {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
    }
    
    .current-image img {
        width: 120px;
        height: 168px; /* 5:7 aspect ratio */
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid #ddd;
    }
    
    .image-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .change-image-btn,
    .remove-image-btn,
    .add-image-btn {
        padding: 0.375rem 0.75rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-family: var(--font-body);
        font-size: 0.8rem;
        transition: all 0.2s ease;
    }
    
    .change-image-btn:hover,
    .add-image-btn:hover {
        background: var(--accent);
        color: white;
        border-color: var(--accent);
    }
    
    .remove-image-btn {
        background: #fee;
        border-color: #fcc;
        color: #c53030;
    }
    
    .remove-image-btn:hover {
        background: #fed7d7;
        border-color: #fc8181;
    }
    
    .no-image {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }
    
    .no-image-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 120px;
        height: 168px;
        border: 2px dashed #ccc;
        border-radius: 4px;
        background: #fafafa;
        color: #999;
    }
    
    .no-image-placeholder span {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
    
    .no-image-placeholder p {
        margin: 0;
        font-size: 0.8rem;
        text-align: center;
    }
    
    /* Attribute Editor Modal */
    .attribute-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }
    
    .attribute-modal {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .dialog-content {
            grid-template-columns: 1fr;
            gap: 0.75rem;
        }
        
        .card-edit-dialog {
            height: 95vh;
        }
        
        .preview-section {
            order: -1; /* Show preview first on mobile */
        }
        
        .preview-wrapper {
            height: 200px;
        }
        
        .attribute-modal {
            margin: 0.5rem;
            max-width: none;
        }
    }
</style>
