<script lang="ts">
    import type { DeckConflict, ConflictSummary as SummaryType } from '$lib/next/utils/deckMerging.js';
    import { METADATA_RESOLUTION, CARD_RESOLUTION, CARD_CONFLICT_TYPE } from '$lib/next/utils/mergeConstants.js';
    
    interface Props {
        conflict: DeckConflict;
        summary: SummaryType;
    }
    
    const { conflict, summary }: Props = $props();
    
    // Group metadata conflicts by type for better display
    let metaConflictsByField = $derived(() => {
        if (!conflict.metaConflicts || !Array.isArray(conflict.metaConflicts)) {
            return {};
        }
        return conflict.metaConflicts.reduce((acc, mc) => {
            if (!acc[mc.field]) acc[mc.field] = [];
            acc[mc.field].push(mc);
            return acc;
        }, {} as Record<string, typeof conflict.metaConflicts>);
    });
    
    // Group card conflicts by type for statistics
    let cardStats = $derived(() => {
        if (!conflict.cardConflicts || !Array.isArray(conflict.cardConflicts)) {
            return { added: 0, modified: 0, removed: 0 };
        }
        
        // Only count conflicts that are resolved with actions
        const added = conflict.cardConflicts.filter(cc => 
            cc.type === CARD_CONFLICT_TYPE.ADDED && cc.resolution === CARD_RESOLUTION.ADD
        ).length;
        
        const modified = conflict.cardConflicts.filter(cc => 
            cc.type === CARD_CONFLICT_TYPE.MODIFIED && (cc.resolution === CARD_RESOLUTION.USE_IMPORTED || cc.resolution === CARD_RESOLUTION.KEEP_EXISTING)
        ).length;
        
        const removed = conflict.cardConflicts.filter(cc => 
            cc.type === CARD_CONFLICT_TYPE.REMOVED && cc.resolution === CARD_RESOLUTION.REMOVE
        ).length;
        
        return { added, modified, removed };
    });
    
    // Calculate final card count after merge
    let finalCardCount = $derived((
        conflict.existingDeck?.cards?.length || 0
    ) + (
        cardStats.added || 0
    ) - (
        cardStats.removed || 0
    ));
</script>

<div class="conflict-summary">
    <div class="summary-header">
        <h3>📋 Import Summary</h3>
        <p class="summary-description">
            Here's what will change when you import this deck:
        </p>
    </div>
    
    <div class="changes-grid">
        <!-- Deck Metadata Changes -->
        {#if summary.metaChanges > 0}
            <div class="change-section">
                <div class="section-header">
                    <span class="icon">🏷️</span>
                    <h4>Deck Information</h4>
                    <span class="count">{summary.metaChanges}</span>
                </div>
                
                <div class="changes-list">
                    {#each Object.entries(metaConflictsByField) as [field, conflicts]}
                        <div class="change-item">
                            <span class="field-name">{field}</span>
                            <div class="conflict-indicators">
                                {#each conflicts as conflict}
                                    <span class="conflict-status" class:resolved={conflict.resolution !== METADATA_RESOLUTION.UNRESOLVED}>
                                        {#if conflict.resolution === METADATA_RESOLUTION.UNRESOLVED}
                                            ⚠️
                                        {:else if conflict.resolution === METADATA_RESOLUTION.KEEP_EXISTING}
                                            📁 Keep current
                                        {:else if conflict.resolution === METADATA_RESOLUTION.USE_IMPORTED}
                                            📥 Use imported
                                        {:else}
                                            🔀 Custom
                                        {/if}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
        
        <!-- Card Changes -->
        {#if summary.cardsAdded + summary.cardsModified + summary.cardsRemoved > 0}
            <div class="change-section">
                <div class="section-header">
                    <span class="icon">🃏</span>
                    <h4>Cards</h4>
                    <span class="count">{summary.cardsAdded + summary.cardsModified + summary.cardsRemoved}</span>
                </div>
                
                <div class="card-stats">
                    {#if cardStats.added > 0}
                        <div class="stat-item added">
                            <span class="stat-icon">➕</span>
                            <span class="stat-text">{cardStats.added} new cards</span>
                        </div>
                    {/if}
                    
                    {#if cardStats.modified > 0}
                        <div class="stat-item modified">
                            <span class="stat-icon">✏️</span>
                            <span class="stat-text">{cardStats.modified} modified cards</span>
                        </div>
                    {/if}
                    
                    {#if cardStats.removed > 0}
                        <div class="stat-item removed">
                            <span class="stat-icon">🗑️</span>
                            <span class="stat-text">{cardStats.removed} removed cards</span>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
    
    <!-- Smart Defaults Info -->
    <div class="smart-defaults-info">
        <div class="info-header">
            <span class="icon">🧠</span>
            <h4>Automatic Resolution</h4>
        </div>
        <p class="info-text">
            Smart defaults have been applied to automatically resolve conflicts where possible.
            {#if summary.unresolvedConflicts > 0}
                <strong>{summary.unresolvedConflicts} conflicts</strong> still require your attention.
            {:else}
                All conflicts have been resolved automatically!
            {/if}
        </p>
        
        {#if summary.unresolvedConflicts > 0}
            <div class="next-steps">
                <p>👆 Use the tabs above to review and resolve the remaining conflicts.</p>
            </div>
        {/if}
    </div>
    
    <!-- Preview of what happens -->
    <div class="merge-preview">
        <div class="preview-header">
            <span class="icon">🔮</span>
            <h4>After Merge</h4>
        </div>
        <div class="preview-content">
            <div class="preview-item">
                <strong>Your deck will have:</strong>
                <ul>
                    <li>{finalCardCount} total cards</li>
                    <li>Latest metadata from {summary.metaChanges > 0 ? 'resolved conflicts' : 'current version'}</li>
                    <li>All your existing data preserved where no conflicts exist</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<style>
    .conflict-summary {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .summary-header {
        text-align: center;
        margin-bottom: 1rem;
    }
    
    .summary-header h3 {
        margin: 0 0 0.5rem 0;
        color: var(--ui-text, #1a202c);
        font-size: 1.25rem;
    }
    
    .summary-description {
        margin: 0;
        color: var(--ui-muted, #64748b);
        font-size: 0.9rem;
    }
    
    .changes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    
    .change-section {
        background: var(--ui-hover-bg, #f8fafc);
        border-radius: 8px;
        padding: 1.25rem;
        border: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .section-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .section-header .icon {
        font-size: 1.1rem;
    }
    
    .section-header h4 {
        margin: 0;
        flex: 1;
        color: var(--ui-text, #1a202c);
        font-size: 1rem;
    }
    
    .section-header .count {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-weight: 600;
    }
    
    .changes-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .change-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: white;
        border-radius: 4px;
        border: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .field-name {
        font-weight: 500;
        color: var(--ui-text, #1a202c);
        text-transform: capitalize;
    }
    
    .conflict-indicators {
        display: flex;
        gap: 0.25rem;
    }
    
    .conflict-status {
        font-size: 0.8rem;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        background: var(--ui-warning-bg, #fef3c7);
        color: var(--ui-warning-text, #92400e);
    }
    
    .conflict-status.resolved {
        background: var(--ui-success-bg, #d1fae5);
        color: var(--ui-success-text, #065f46);
    }
    
    .card-stats {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: white;
        border-radius: 4px;
        border: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .stat-item.added {
        border-left: 3px solid var(--ui-success-bg, #10b981);
    }
    
    .stat-item.modified {
        border-left: 3px solid var(--ui-warning-bg, #f59e0b);
    }
    
    .stat-item.removed {
        border-left: 3px solid var(--ui-danger-bg, #ef4444);
    }
    
    .stat-icon {
        font-size: 1rem;
    }
    
    .stat-text {
        color: var(--ui-text, #1a202c);
        font-size: 0.9rem;
    }
    
    .smart-defaults-info,
    .merge-preview {
        background: var(--ui-bg, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 8px;
        padding: 1.25rem;
    }
    
    .info-header,
    .preview-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }
    
    .info-header h4,
    .preview-header h4 {
        margin: 0;
        color: var(--ui-text, #1a202c);
        font-size: 1rem;
    }
    
    .info-text {
        margin: 0 0 1rem 0;
        color: var(--ui-text, #1a202c);
        font-size: 0.9rem;
        line-height: 1.5;
    }
    
    .next-steps {
        padding: 0.75rem;
        background: var(--ui-info-bg, #dbeafe);
        border-radius: 6px;
        border-left: 3px solid var(--button-primary-bg, #3b82f6);
    }
    
    .next-steps p {
        margin: 0;
        color: var(--ui-info-text, #1e40af);
        font-size: 0.9rem;
    }
    
    .preview-content {
        color: var(--ui-text, #1a202c);
    }
    
    .preview-item strong {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--ui-text, #1a202c);
    }
    
    .preview-item ul {
        margin: 0;
        padding-left: 1.25rem;
        color: var(--ui-muted, #64748b);
    }
    
    .preview-item li {
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
    }
    
    /* Responsive */
    @media (max-width: 640px) {
        .changes-grid {
            grid-template-columns: 1fr;
        }
        
        .change-item {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
        }
        
        .conflict-indicators {
            justify-content: flex-start;
        }
    }
</style>
