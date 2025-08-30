<script lang="ts">
    import type { MetaConflict, Deck } from '$lib/next/utils/deckMerging.js';
    import { METADATA_RESOLUTION } from '$lib/next/utils/mergeConstants.js';
    
    interface Props {
        metaConflicts: MetaConflict[];
        existingDeck: Deck;
        importedDeck: Deck;
        onUpdate: (metaConflicts: MetaConflict[]) => void;
    }
    
    const { metaConflicts, existingDeck, importedDeck, onUpdate }: Props = $props();
    
    function updateConflict(index: number, resolution: MetaConflict['resolution'], customValue?: any) {
        const updated = [...metaConflicts];
        updated[index] = {
            ...updated[index],
            resolution,
            customValue
        };
        onUpdate(updated);
    }
    
    function getDisplayValue(value: any): string {
        if (value === null || value === undefined) return '(empty)';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (Array.isArray(value)) return value.join(', ') || '(empty list)';
        return JSON.stringify(value);
    }
    
    function getFieldDisplayName(field: string): string {
        const fieldNames: Record<string, string> = {
            title: 'Deck Title',
            description: 'Description',
            tags: 'Tags',
            isPublic: 'Public Sharing',
            lastEdited: 'Last Edited Date',
            version: 'Version',
            author: 'Author'
        };
        return fieldNames[field] || field.charAt(0).toUpperCase() + field.slice(1);
    }
    
    function formatValue(field: string, value: any): string {
        if (field === 'lastEdited' && typeof value === 'number') {
            return new Date(value).toLocaleString();
        }
        return getDisplayValue(value);
    }
</script>

<div class="meta-conflicts">
    <div class="conflicts-header">
        <h3>🏷️ Deck Information Conflicts</h3>
        <p class="conflicts-description">
            Choose how to resolve differences in deck metadata:
        </p>
    </div>
    
    <div class="conflicts-list">
        {#each metaConflicts as conflict, index}
            <div class="conflict-item" class:resolved={conflict.resolution !== METADATA_RESOLUTION.UNRESOLVED}>
                <div class="conflict-header">
                    <h4>{getFieldDisplayName(conflict.field)}</h4>
                    <div class="conflict-status">
                        {#if conflict.resolution === METADATA_RESOLUTION.UNRESOLVED}
                            <span class="status-badge unresolved">⚠️ Needs resolution</span>
                        {:else if conflict.resolution === METADATA_RESOLUTION.KEEP_EXISTING}
                            <span class="status-badge resolved">📁 Keep current</span>
                        {:else if conflict.resolution === METADATA_RESOLUTION.USE_IMPORTED}
                            <span class="status-badge resolved">📥 Use imported</span>
                        {:else}
                            <span class="status-badge resolved">🔀 Custom value</span>
                        {/if}
                    </div>
                </div>
                
                <div class="values-comparison">
                    <!-- Existing Value -->
                    <div class="value-option" class:selected={conflict.resolution === METADATA_RESOLUTION.KEEP_EXISTING}>
                        <div class="option-header">
                            <input
                                type="radio"
                                name="conflict-{index}"
                                checked={conflict.resolution === METADATA_RESOLUTION.KEEP_EXISTING}
                                onchange={() => updateConflict(index, METADATA_RESOLUTION.KEEP_EXISTING)}
                            />
                            <label>📁 Keep Current</label>
                        </div>
                        <div class="value-display existing">
                            {formatValue(conflict.field, conflict.existingValue)}
                        </div>
                    </div>
                    
                    <!-- Imported Value -->
                    <div class="value-option" class:selected={conflict.resolution === METADATA_RESOLUTION.USE_IMPORTED}>
                        <div class="option-header">
                            <input
                                type="radio"
                                name="conflict-{index}"
                                checked={conflict.resolution === METADATA_RESOLUTION.USE_IMPORTED}
                                onchange={() => updateConflict(index, METADATA_RESOLUTION.USE_IMPORTED)}
                            />
                            <label>📥 Use Imported</label>
                        </div>
                        <div class="value-display imported">
                            {formatValue(conflict.field, conflict.importedValue)}
                        </div>
                    </div>
                </div>
                
                <!-- Custom Value Option -->
                <div class="custom-option">
                    <div class="option-header">
                        <input
                            type="radio"
                            name="conflict-{index}"
                            checked={conflict.resolution === METADATA_RESOLUTION.CUSTOM}
                            onchange={() => updateConflict(index, METADATA_RESOLUTION.CUSTOM, conflict.customValue || conflict.existingValue)}
                        />
                        <label>✏️ Enter Custom Value</label>
                    </div>
                    
                    {#if conflict.resolution === METADATA_RESOLUTION.CUSTOM}
                        <div class="custom-input">
                            {#if conflict.field === 'tags' && Array.isArray(conflict.existingValue)}
                                <input
                                    type="text"
                                    placeholder="Enter tags separated by commas"
                                    value={Array.isArray(conflict.customValue) ? conflict.customValue.join(', ') : ''}
                                    oninput={(e) => {
                                        const value = e.currentTarget.value;
                                        const tags = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                                        updateConflict(index, METADATA_RESOLUTION.CUSTOM, tags);
                                    }}
                                />
                            {:else if conflict.field === 'isPublic' && typeof conflict.existingValue === 'boolean'}
                                <select
                                    value={conflict.customValue?.toString() || 'false'}
                                    onchange={(e) => updateConflict(index, METADATA_RESOLUTION.CUSTOM, e.currentTarget.value === 'true')}
                                >
                                    <option value="true">Yes (Public)</option>
                                    <option value="false">No (Private)</option>
                                </select>
                            {:else if conflict.field === 'lastEdited'}
                                <p class="custom-note">
                                    📝 The last edited date will be automatically set to now when you apply the merge.
                                </p>
                            {:else}
                                <input
                                    type="text"
                                    placeholder="Enter custom value"
                                    value={conflict.customValue || ''}
                                    oninput={(e) => updateConflict(index, METADATA_RESOLUTION.CUSTOM, e.currentTarget.value)}
                                />
                            {/if}
                        </div>
                    {/if}
                </div>
                
                <!-- Recommendation if available -->
                {#if conflict.recommendation}
                    <div class="recommendation">
                        <span class="rec-icon">💡</span>
                        <span class="rec-text">Recommendation: {conflict.recommendation}</span>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
    
    {#if metaConflicts.length === 0}
        <div class="no-conflicts">
            <span class="icon">✅</span>
            <p>No metadata conflicts detected. All deck information is compatible!</p>
        </div>
    {/if}
</div>

<style>
    .meta-conflicts {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .conflicts-header {
        text-align: center;
        margin-bottom: 1rem;
    }
    
    .conflicts-header h3 {
        margin: 0 0 0.5rem 0;
        color: var(--ui-text, #1a202c);
        font-size: 1.25rem;
    }
    
    .conflicts-description {
        margin: 0;
        color: var(--ui-muted, #64748b);
        font-size: 0.9rem;
    }
    
    .conflicts-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .conflict-item {
        background: var(--ui-bg, #ffffff);
        border: 2px solid var(--ui-warning-border, #fbbf24);
        border-radius: 8px;
        padding: 1.25rem;
        transition: border-color 0.2s ease;
    }
    
    .conflict-item.resolved {
        border-color: var(--ui-success-border, #10b981);
    }
    
    .conflict-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .conflict-header h4 {
        margin: 0;
        color: var(--ui-text, #1a202c);
        font-size: 1.1rem;
    }
    
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .status-badge.unresolved {
        background: var(--ui-warning-bg, #fef3c7);
        color: var(--ui-warning-text, #92400e);
    }
    
    .status-badge.resolved {
        background: var(--ui-success-bg, #d1fae5);
        color: var(--ui-success-text, #065f46);
    }
    
    .values-comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .value-option {
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        padding: 1rem;
        background: var(--ui-hover-bg, #f8fafc);
        transition: all 0.2s ease;
    }
    
    .value-option.selected {
        border-color: var(--button-primary-bg, #3b82f6);
        background: var(--ui-primary-bg, #eff6ff);
    }
    
    .option-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }
    
    .option-header input[type="radio"] {
        margin: 0;
        cursor: pointer;
    }
    
    .option-header label {
        font-weight: 500;
        color: var(--ui-text, #1a202c);
        cursor: pointer;
        font-size: 0.9rem;
    }
    
    .value-display {
        padding: 0.75rem;
        background: var(--ui-bg, #ffffff);
        border-radius: 4px;
        border: 1px solid var(--ui-border, #e2e8f0);
        font-family: var(--ui-mono-font, 'SF Mono', Monaco, 'Cascadia Code', monospace);
        font-size: 0.9rem;
        color: var(--ui-text, #1a202c);
        word-break: break-word;
        min-height: 2.5rem;
        display: flex;
        align-items: center;
    }
    
    .value-display.existing {
        border-left: 3px solid var(--ui-info-bg, #3b82f6);
    }
    
    .value-display.imported {
        border-left: 3px solid var(--ui-success-bg, #10b981);
    }
    
    .custom-option {
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        padding: 1rem;
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .custom-input {
        margin-top: 0.75rem;
    }
    
    .custom-input input,
    .custom-input select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 0.9rem;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
    }
    
    .custom-input input:focus,
    .custom-input select:focus {
        outline: none;
        border-color: var(--button-primary-bg, #3b82f6);
        box-shadow: 0 0 0 2px var(--ui-primary-bg, #eff6ff);
    }
    
    .custom-note {
        margin: 0;
        padding: 0.75rem;
        background: var(--ui-info-bg, #dbeafe);
        border-radius: 4px;
        color: var(--ui-info-text, #1e40af);
        font-size: 0.85rem;
        border-left: 3px solid var(--button-primary-bg, #3b82f6);
    }
    
    .recommendation {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: var(--ui-info-bg, #dbeafe);
        border-radius: 6px;
        margin-top: 1rem;
        border-left: 3px solid var(--button-primary-bg, #3b82f6);
    }
    
    .rec-icon {
        font-size: 1rem;
    }
    
    .rec-text {
        color: var(--ui-info-text, #1e40af);
        font-size: 0.9rem;
    }
    
    .no-conflicts {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        background: var(--ui-success-bg, #d1fae5);
        border-radius: 8px;
        text-align: center;
    }
    
    .no-conflicts .icon {
        font-size: 2rem;
    }
    
    .no-conflicts p {
        margin: 0;
        color: var(--ui-success-text, #065f46);
        font-size: 1rem;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .values-comparison {
            grid-template-columns: 1fr;
        }
        
        .conflict-header {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
        }
        
        .status-badge {
            align-self: flex-start;
        }
    }
</style>
