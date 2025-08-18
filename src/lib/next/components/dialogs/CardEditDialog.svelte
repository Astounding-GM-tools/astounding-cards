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
    
    // Props passed when dialog opens
    const { cardId }: { cardId: string } = $props();
    
    // Get the card from store
    let card = $derived(nextDeckStore.getCard(cardId));
    
    // Working state for form (unsaved changes)
    let formData = $state({
        title: '',
        subtitle: '',
        description: '',
        // We'll add stats and traits later
    });
    
    // Update form when card changes
    $effect(() => {
        if (card) {
            formData.title = card.title;
            formData.subtitle = card.subtitle;
            formData.description = card.description;
        }
    });
    
    let isSaving = $state(false);
    let hasChanges = $state(false);
    
    // Check for changes
    $effect(() => {
        if (card) {
            hasChanges = 
                formData.title !== card.title ||
                formData.subtitle !== card.subtitle ||
                formData.description !== card.description;
        }
    });
    
    async function saveChanges() {
        if (!card || !hasChanges) return;
        
        isSaving = true;
        const success = await nextDeckStore.updateCard(card.id, {
            title: formData.title,
            subtitle: formData.subtitle,
            description: formData.description
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
</script>

{#if card}
    <div class="card-edit-dialog">
        <header class="dialog-header">
            <h2>Edit Card</h2>
            <button class="close-button" onclick={cancelChanges} title="Close">×</button>
        </header>
        
        <div class="dialog-content">
            <!-- Live Preview Section -->
            <section class="preview-section">
                <h3>Preview</h3>
                <div class="mini-card">
                    <div class="mini-card-content">
                        <h4>{formData.title || 'Untitled Card'}</h4>
                        <p class="subtitle">{formData.subtitle || 'No subtitle'}</p>
                        <p class="description">{formData.description || 'No description'}</p>
                    </div>
                </div>
            </section>
            
            <!-- Edit Form Section -->
            <section class="edit-section">
                <h3>Basic Information</h3>
                
                <div class="form-group">
                    <label for="title">Title</label>
                    <input 
                        id="title"
                        type="text" 
                        bind:value={formData.title}
                        placeholder="Enter card title"
                        maxlength="100"
                    />
                </div>
                
                <div class="form-group">
                    <label for="subtitle">Subtitle</label>
                    <input 
                        id="subtitle"
                        type="text" 
                        bind:value={formData.subtitle}
                        placeholder="Enter card subtitle (e.g., Character, Item, Location)"
                        maxlength="50"
                    />
                </div>
                
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea 
                        id="description"
                        bind:value={formData.description}
                        placeholder="Enter card description"
                        rows="4"
                        maxlength="500"
                    ></textarea>
                </div>
                
                <!-- TODO: Add Stats and Traits sections -->
                <div class="coming-soon">
                    <p><strong>Coming Next:</strong></p>
                    <ul>
                        <li>📊 Stats Editor</li>
                        <li>🏷️ Traits Editor</li>
                        <li>🖼️ Image Upload</li>
                    </ul>
                </div>
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
        min-height: 70vh;
        max-height: 90vh;
        width: 100%;
        max-width: 900px;
        font-family: var(--font-body);
    }
    
    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
        margin-bottom: 1rem;
    }
    
    .dialog-header h2 {
        margin: 0;
        color: var(--color);
        font-family: var(--font-title);
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--accent);
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .close-button:hover {
        background: #f0f0f0;
    }
    
    .dialog-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        flex: 1;
        overflow-y: auto;
    }
    
    .preview-section h3,
    .edit-section h3 {
        margin: 0 0 1rem 0;
        color: var(--color);
        font-family: var(--font-title);
        font-size: 1.1rem;
    }
    
    /* Live Preview Styles */
    .mini-card {
        border: 2px solid var(--accent);
        border-radius: 8px;
        padding: 1rem;
        background: white;
        aspect-ratio: 5/7;
        display: flex;
        flex-direction: column;
    }
    
    .mini-card h4 {
        margin: 0 0 0.5rem 0;
        color: var(--accent);
        font-family: var(--font-title);
        font-size: 1.1rem;
    }
    
    .mini-card .subtitle {
        margin: 0 0 1rem 0;
        color: var(--color);
        font-size: 0.9rem;
    }
    
    .mini-card .description {
        margin: 0;
        color: var(--color);
        font-size: 0.8rem;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 6;
        -webkit-box-orient: vertical;
    }
    
    /* Form Styles */
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--color);
    }
    
    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: var(--font-body);
        font-size: 1rem;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 2px rgba(74, 85, 104, 0.1);
    }
    
    .coming-soon {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 1rem;
        margin-top: 2rem;
    }
    
    .coming-soon p {
        margin: 0 0 0.5rem 0;
        color: var(--accent);
    }
    
    .coming-soon ul {
        margin: 0;
        padding-left: 1.5rem;
    }
    
    .coming-soon li {
        color: var(--color);
        margin-bottom: 0.25rem;
    }
    
    /* Footer Styles */
    .dialog-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid #eee;
        margin-top: 1rem;
    }
    
    .dialog-status {
        font-size: 0.9rem;
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
        gap: 0.5rem;
    }
    
    .dialog-actions button {
        padding: 0.75rem 1.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-family: var(--font-body);
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
    
    /* Responsive */
    @media (max-width: 768px) {
        .dialog-content {
            grid-template-columns: 1fr;
        }
        
        .card-edit-dialog {
            min-height: 80vh;
        }
    }
</style>
