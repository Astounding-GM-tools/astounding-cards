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
    
    // Create preview card with live form data
    let previewCard = $derived(card ? {
        ...card,
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description
    } : null);
    
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
            
            <!-- Live Preview Section -->
            <section class="preview-section">
                {#if previewCard}
                    <div class="preview-container" data-layout="poker">
                        <!-- Front Card Preview -->
                        <div class="preview-wrapper">
                            <CardComponent>
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
    }
</style>
