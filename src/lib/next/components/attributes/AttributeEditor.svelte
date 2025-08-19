<!--
    AttributeEditor - Unified editor for Traits and Stats
    
    Can edit both Trait and Stat types with a mode prop:
    - mode="trait": Shows title, isPublic, description
    - mode="stat": Shows title, isPublic, value, tracked, description
    
    Layout:
    Line 1: title input + public checkbox
    Line 2: value input (number) + tracked checkbox (stat mode only)
    Line 3: description input (textarea)
-->
<script lang="ts">
    import type { Trait, Stat } from '$lib/next/types/card.js';
    
    type AttributeMode = 'trait' | 'stat';
    
    const { 
        mode, 
        attribute, 
        onSave, 
        onCancel,
        onDelete
    } = $props<{
        mode: AttributeMode;
        attribute: Trait | Stat;
        onSave: (updatedAttribute: Trait | Stat) => void;
        onCancel: () => void;
        onDelete?: () => void;
    }>();
    
    // Form state
    let formData = $state({
        title: '',
        isPublic: true,
        value: 0,
        tracked: false,
        description: ''
    });
    
    // Initialize form with attribute data
    $effect(() => {
        formData.title = attribute.title;
        formData.isPublic = attribute.isPublic;
        formData.description = mode === 'trait' ? attribute.description : (attribute as Stat).description || '';
        
        if (mode === 'stat') {
            const stat = attribute as Stat;
            formData.value = stat.value;
            formData.tracked = stat.tracked;
        }
    });
    
    // Check for changes
    let hasChanges = $derived(() => {
        if (mode === 'trait') {
            const trait = attribute as Trait;
            return (
                formData.title !== trait.title ||
                formData.isPublic !== trait.isPublic ||
                formData.description !== trait.description
            );
        } else {
            const stat = attribute as Stat;
            return (
                formData.title !== stat.title ||
                formData.isPublic !== stat.isPublic ||
                formData.value !== stat.value ||
                formData.tracked !== stat.tracked ||
                formData.description !== (stat.description || '')
            );
        }
    });
    
    function handleSave() {
        if (mode === 'trait') {
            const updatedTrait: Trait = {
                title: formData.title,
                isPublic: formData.isPublic,
                description: formData.description
            };
            onSave(updatedTrait);
        } else {
            const updatedStat: Stat = {
                title: formData.title,
                isPublic: formData.isPublic,
                value: formData.value,
                tracked: formData.tracked,
                description: formData.description || undefined
            };
            onSave(updatedStat);
        }
    }
    
    function handleReset() {
        formData.title = attribute.title;
        formData.isPublic = attribute.isPublic;
        formData.description = mode === 'trait' ? attribute.description : (attribute as Stat).description || '';
        
        if (mode === 'stat') {
            const stat = attribute as Stat;
            formData.value = stat.value;
            formData.tracked = stat.tracked;
        }
    }
</script>

<div class="attribute-editor">
    <div class="editor-content">
        <!-- Line 1: Title + Public -->
        <div class="form-row">
            <input 
                type="text" 
                bind:value={formData.title}
                placeholder="{mode === 'stat' ? 'Stat' : 'Trait'} title"
                class="title-input"
                maxlength="50"
            />
            <label class="checkbox-label">
                <input 
                    type="checkbox" 
                    bind:checked={formData.isPublic}
                />
                Public
            </label>
        </div>
        
        <!-- Line 2: Value + Tracked (stat mode only) -->
        {#if mode === 'stat'}
            <div class="form-row">
                <input 
                    type="number" 
                    bind:value={formData.value}
                    placeholder="Value"
                    class="value-input"
                    min="0"
                    max="999"
                />
                <label class="checkbox-label">
                    <input 
                        type="checkbox" 
                        bind:checked={formData.tracked}
                    />
                    Tracked
                </label>
            </div>
        {/if}
        
        <!-- Line 3: Description -->
        <div class="form-row full-width">
            <textarea 
                bind:value={formData.description}
                placeholder="{mode === 'stat' ? 'Optional description' : 'Description'}"
                class="description-input"
                rows="2"
                maxlength="200"
                required={mode === 'trait'}
            ></textarea>
        </div>
    </div>
    
    <div class="editor-actions">
        <div class="editor-status">
            {#if hasChanges}
                <span class="changes">✏️ Unsaved changes</span>
            {:else}
                <span class="saved">✅ No changes</span>
            {/if}
        </div>
        
        <div class="action-buttons">
            {#if onDelete}
                <button class="delete-btn" onclick={onDelete}>
                    Delete
                </button>
            {/if}
            <button onclick={handleReset} disabled={!hasChanges}>
                Reset
            </button>
            <button onclick={onCancel}>
                Cancel
            </button>
            <button 
                class="primary" 
                onclick={handleSave} 
                disabled={!hasChanges || !formData.title.trim() || (mode === 'trait' && !formData.description.trim())}
            >
                Save
            </button>
        </div>
    </div>
</div>

<style>
    .attribute-editor {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        font-family: var(--font-body);
    }
    
    .editor-content {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75rem;
        align-items: center;
    }
    
    .form-row.full-width {
        grid-template-columns: 1fr;
    }
    
    .title-input,
    .value-input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-family: var(--font-body);
        font-size: 0.9rem;
    }
    
    .title-input {
        min-width: 0; /* Allow shrinking */
    }
    
    .value-input {
        width: 80px;
        text-align: center;
    }
    
    .description-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-family: var(--font-body);
        font-size: 0.9rem;
        resize: vertical;
        min-height: 60px;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.85rem;
        white-space: nowrap;
        cursor: pointer;
    }
    
    .checkbox-label input[type="checkbox"] {
        margin: 0;
    }
    
    .title-input:focus,
    .value-input:focus,
    .description-input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 2px rgba(74, 85, 104, 0.1);
    }
    
    .editor-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 0.75rem;
        border-top: 1px solid #eee;
    }
    
    .editor-status {
        font-size: 0.8rem;
    }
    
    .changes {
        color: #e67e22;
    }
    
    .saved {
        color: #27ae60;
    }
    
    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }
    
    .action-buttons button {
        padding: 0.375rem 0.75rem;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-family: var(--font-body);
        font-size: 0.85rem;
    }
    
    .action-buttons button:hover:not(:disabled) {
        background: #f5f5f5;
    }
    
    .action-buttons button.primary {
        background: var(--accent);
        color: white;
        border-color: var(--accent);
    }
    
    .action-buttons button.primary:hover:not(:disabled) {
        opacity: 0.9;
    }
    
    .action-buttons button.delete-btn {
        background: #e74c3c;
        color: white;
        border-color: #e74c3c;
    }
    
    .action-buttons button.delete-btn:hover:not(:disabled) {
        opacity: 0.9;
    }
    
    .action-buttons button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Responsive adjustments */
    @media (max-width: 400px) {
        .form-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }
        
        .checkbox-label {
            justify-self: start;
        }
        
        .action-buttons {
            flex-wrap: wrap;
            gap: 0.375rem;
        }
        
        .action-buttons button {
            font-size: 0.8rem;
            padding: 0.3rem 0.6rem;
        }
    }
</style>
