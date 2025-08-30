<script lang="ts">
    import type { DeckConflict, MergeResolution } from '$lib/next/utils/deckMerging.js';
    import { 
        applySmartDefaults, 
        createMergeResolution, 
        hasUnresolvedConflicts, 
        getConflictSummary 
    } from '$lib/next/utils/deckMerging.js';
    import ConflictSummary from './ConflictSummary.svelte';
    import MetaConflicts from './MetaConflicts.svelte';
    import CardConflicts from './CardConflicts.svelte';
    
    interface Props {
        conflict: DeckConflict;
        onResolve: (resolution: MergeResolution) => void;
        onCancel: () => void;
    }
    
    const { conflict: initialConflict, onResolve, onCancel }: Props = $props();
    
    // Apply smart defaults initially
    let conflict = $state(applySmartDefaults(initialConflict));
    let activeTab = $state<'summary' | 'metadata' | 'cards'>('summary');
    
    // Computed values
    let summary = $derived(getConflictSummary(conflict));
    let hasUnresolved = $derived(hasUnresolvedConflicts(conflict));
    let canResolve = $derived(!hasUnresolved);
    
    function handleResolve() {
        if (!canResolve) return;
        
        const resolution = createMergeResolution(conflict);
        onResolve(resolution);
    }
    
    function handleConflictUpdate(updatedConflict: DeckConflict) {
        conflict = updatedConflict;
    }
    
    // Format dates for display
    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }
</script>

<div class="merge-tool">
    <div class="merge-header">
        <h2>🔄 Resolve Import Conflicts</h2>
        <p class="deck-info">
            Importing <strong>{conflict.importedDeck.meta.title}</strong> conflicts with existing deck.
        </p>
        
        <div class="deck-comparison">
            <div class="deck-version">
                <h4>📁 Your Current Version</h4>
                <p>{conflict.existingDeck.meta.title}</p>
                <p class="timestamp">Last edited: {formatDate(conflict.existingDeck.meta.lastEdited)}</p>
            </div>
            
            <div class="deck-version">
                <h4>📥 Imported Version</h4>
                <p>{conflict.importedDeck.meta.title}</p>
                <p class="timestamp">Last edited: {formatDate(conflict.importedDeck.meta.lastEdited)}</p>
            </div>
        </div>
    </div>
    
    <div class="tabs">
        <button 
            class="tab-button" 
            class:active={activeTab === 'summary'}
            onclick={() => activeTab = 'summary'}
        >
            📊 Summary
            {#if summary.metaChanges + summary.cardsAdded + summary.cardsModified + summary.cardsRemoved > 0}
                <span class="badge">
                    {summary.metaChanges + summary.cardsAdded + summary.cardsModified + summary.cardsRemoved}
                </span>
            {/if}
        </button>
        
        {#if conflict.metaConflicts.length > 0}
            <button 
                class="tab-button" 
                class:active={activeTab === 'metadata'}
                onclick={() => activeTab = 'metadata'}
            >
                🏷️ Deck Info
                <span class="badge">{summary.metaChanges}</span>
            </button>
        {/if}
        
        {#if conflict.cardConflicts.length > 0}
            <button 
                class="tab-button" 
                class:active={activeTab === 'cards'}
                onclick={() => activeTab = 'cards'}
            >
                🃏 Cards
                <span class="badge">{summary.cardsAdded + summary.cardsModified + summary.cardsRemoved}</span>
            </button>
        {/if}
    </div>
    
    <div class="tab-content">
        {#if activeTab === 'summary'}
            <ConflictSummary {conflict} {summary} />
        {:else if activeTab === 'metadata'}
            <MetaConflicts 
                metaConflicts={conflict.metaConflicts}
                existingDeck={conflict.existingDeck}
                importedDeck={conflict.importedDeck}
                onUpdate={(metaConflicts) => handleConflictUpdate({ ...conflict, metaConflicts })}
            />
        {:else if activeTab === 'cards'}
            <CardConflicts 
                cardConflicts={conflict.cardConflicts}
                onUpdate={(cardConflicts) => handleConflictUpdate({ ...conflict, cardConflicts })}
            />
        {/if}
    </div>
    
    <div class="actions">
        <button 
            class="action-button secondary"
            onclick={onCancel}
        >
            Cancel Import
        </button>
        
        <button 
            class="action-button primary"
            onclick={handleResolve}
            disabled={!canResolve}
        >
            {canResolve ? 'Apply Merge' : 'Resolve Conflicts'}
            {#if hasUnresolved}
                ⚠️
            {:else}
                ✅
            {/if}
        </button>
    </div>
</div>

<style>
    .merge-tool {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 800px;
        width: 100%;
        background: var(--ui-bg, #ffffff);
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: var(--page-shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
    }
    
    .merge-header {
        text-align: center;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        padding-bottom: 1.5rem;
    }
    
    .merge-header h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--ui-text, #1a202c);
    }
    
    .deck-info {
        margin: 0 0 1rem 0;
        color: var(--ui-muted, #64748b);
        font-size: 0.9rem;
    }
    
    .deck-comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-top: 1rem;
    }
    
    .deck-version {
        padding: 1rem;
        background: var(--ui-hover-bg, #f8fafc);
        border-radius: 6px;
        text-align: left;
    }
    
    .deck-version h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--ui-text, #1a202c);
    }
    
    .deck-version p {
        margin: 0 0 0.25rem 0;
        font-weight: 500;
        color: var(--ui-text, #1a202c);
    }
    
    .timestamp {
        font-size: 0.8rem;
        color: var(--ui-muted, #64748b) !important;
        font-weight: normal !important;
    }
    
    .tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .tab-button {
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        cursor: pointer;
        color: var(--ui-text, #1a202c);
        opacity: 0.7;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        font-family: var(--ui-font-family, system-ui);
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .tab-button:hover {
        opacity: 0.9;
    }
    
    .tab-button.active {
        opacity: 1;
        border-bottom-color: var(--button-primary-bg, #3b82f6);
    }
    
    .badge {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
        font-size: 0.75rem;
        padding: 0.2rem 0.4rem;
        border-radius: 10px;
        min-width: 1.2rem;
        height: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .tab-content {
        min-height: 300px;
        padding: 1rem 0;
    }
    
    .actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding-top: 1.5rem;
        border-top: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .action-button {
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .action-button.secondary {
        background: transparent;
        color: var(--ui-text, #1a202c);
        border: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .action-button.secondary:hover {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .action-button.primary {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
        border: 1px solid var(--button-primary-bg, #3b82f6);
    }
    
    .action-button.primary:hover:not(:disabled) {
        background: var(--button-primary-hover-bg, #2563eb);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    
    /* Responsive */
    @media (max-width: 640px) {
        .deck-comparison {
            grid-template-columns: 1fr;
        }
        
        .actions {
            flex-direction: column;
        }
        
        .action-button {
            width: 100%;
            justify-content: center;
        }
    }
</style>
