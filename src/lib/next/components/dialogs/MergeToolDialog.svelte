<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import { nextDb } from '$lib/next/stores/database.js';
    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { toasts } from '$lib/stores/toast.js';
    import type { Deck, Card } from '$lib/next/types/deck.js';
    
    interface Props {
        existingDeck: Deck;
        incomingDeck: Deck;
        onMergeComplete?: () => void;
    }
    
    const { existingDeck, incomingDeck, onMergeComplete }: Props = $props();
    
    // Utility function to check if two cards have conflicts
    function hasCardConflicts(incomingCard: Card, existingCard: Card | undefined): boolean {
        if (!existingCard) {
            // New card, no conflict
            return false;
        }
        
        // Check for differences in main fields
        return (
            incomingCard.title !== existingCard.title ||
            incomingCard.subtitle !== existingCard.subtitle ||
            incomingCard.description !== existingCard.description ||
            JSON.stringify(incomingCard.traits) !== JSON.stringify(existingCard.traits) ||
            JSON.stringify(incomingCard.stats) !== JSON.stringify(existingCard.stats) ||
            // Image comparison - check if both have images but they're different
            (incomingCard.image && existingCard.image && 
                incomingCard.image.url !== existingCard.image.url)
        );
    }
    
    // Get list of cards that actually have conflicts
    let conflictedCards = $derived(
        incomingDeck.cards.filter(incomingCard => {
            const existingCard = existingDeck.cards.find(c => c.id === incomingCard.id);
            return hasCardConflicts(incomingCard, existingCard);
        })
    );
    
    // Get list of new cards (no conflicts, but need user decision)
    let newCards = $derived(
        incomingDeck.cards.filter(incomingCard => {
            const existingCard = existingDeck.cards.find(c => c.id === incomingCard.id);
            return !existingCard;
        })
    );
    
    // Cards that need user input (conflicted + new)
    let cardsNeedingDecision = $derived([...conflictedCards, ...newCards]);
    
    // Auto-handle cards that are identical
    $effect(() => {
        for (const incomingCard of incomingDeck.cards) {
            const existingCard = existingDeck.cards.find(c => c.id === incomingCard.id);
            
            // If card exists and has no conflicts, auto-keep existing
            if (existingCard && !hasCardConflicts(incomingCard, existingCard)) {
                cardMergeDecisions[incomingCard.id] = 'keep';
            }
        }
    });
    
    // Local state
    let isMerging = $state(false);
    let error = $state<string | null>(null);
    let mergeMode = $state<'fast' | 'detailed'>('detailed');
    let fastImportChoice = $state<'accept' | 'skip'>('accept');
    let currentCardIndex = $state(0);
    let cardMergeDecisions = $state<Record<string, 'keep' | 'replace' | 'skip'>>({});
    let deckMetaMergeDecisions = $state({
        title: 'keep' as 'keep' | 'replace',
        theme: 'keep' as 'keep' | 'replace',
        layout: 'keep' as 'keep' | 'replace'
    });
    
    // Computed values - only show cards that need decisions
    let totalCards = $derived(cardsNeedingDecision.length);
    let currentCard = $derived(cardsNeedingDecision[currentCardIndex]);
    let existingCard = $derived(existingDeck.cards.find(c => c.id === currentCard?.id));
    let mergeProgress = $derived(Object.keys(cardMergeDecisions).length);
    let canFinishMerge = $derived(mergeProgress === incomingDeck.cards.length); // Still need all cards decided
    
    // Conflict detection
    let hasMetaConflicts = $derived(
        existingDeck.meta.title !== incomingDeck.meta.title ||
        existingDeck.meta.theme !== incomingDeck.meta.theme ||
        existingDeck.meta.layout !== incomingDeck.meta.layout
    );
    
    function setCardDecision(decision: 'keep' | 'replace' | 'skip') {
        if (currentCard) {
            cardMergeDecisions[currentCard.id] = decision;
        }
        
        // Auto-advance to next card
        if (currentCardIndex < totalCards - 1) {
            currentCardIndex++;
        }
    }
    
    function goToPreviousCard() {
        if (currentCardIndex > 0) {
            currentCardIndex--;
        }
    }
    
    function goToNextCard() {
        if (currentCardIndex < totalCards - 1) {
            currentCardIndex++;
        }
    }
    
    function handleFastImport() {
        if (fastImportChoice === 'accept') {
            // Accept all changes
            for (const card of incomingDeck.cards) {
                const existingCard = existingDeck.cards.find(c => c.id === card.id);
                cardMergeDecisions[card.id] = existingCard ? 'replace' : 'keep';
            }
            deckMetaMergeDecisions.title = 'replace';
            deckMetaMergeDecisions.theme = 'replace';
            deckMetaMergeDecisions.layout = 'replace';
        } else {
            // Skip all changes
            for (const card of incomingDeck.cards) {
                cardMergeDecisions[card.id] = 'skip';
            }
            deckMetaMergeDecisions.title = 'keep';
            deckMetaMergeDecisions.theme = 'keep';
            deckMetaMergeDecisions.layout = 'keep';
        }
    }
    
    async function executeMerge() {
        isMerging = true;
        error = null;
        
        try {
            // Build the merged deck based on decisions
            const mergedDeck: Deck = {
                id: existingDeck.id, // Keep existing deck ID
                meta: {
                    title: deckMetaMergeDecisions.title === 'replace' ? incomingDeck.meta.title : existingDeck.meta.title,
                    theme: deckMetaMergeDecisions.theme === 'replace' ? incomingDeck.meta.theme : existingDeck.meta.theme,
                    layout: deckMetaMergeDecisions.layout === 'replace' ? incomingDeck.meta.layout : existingDeck.meta.layout,
                    lastEdited: Date.now(), // Update timestamp
                    createdAt: existingDeck.meta.createdAt // Keep original creation date
                },
                cards: [] // Will be populated below
            };
            
            // Start with existing cards
            const cardsMap = new Map<string, Card>();
            existingDeck.cards.forEach(card => {
                cardsMap.set(card.id, card);
            });
            
            // Apply card merge decisions
            for (const incomingCard of incomingDeck.cards) {
                const decision = cardMergeDecisions[incomingCard.id];
                
                switch (decision) {
                    case 'keep':
                        // For new cards, add them; for existing cards, keep the existing version
                        if (!cardsMap.has(incomingCard.id)) {
                            cardsMap.set(incomingCard.id, incomingCard);
                        }
                        break;
                        
                    case 'replace':
                        // Replace existing card with incoming version
                        cardsMap.set(incomingCard.id, incomingCard);
                        break;
                        
                    case 'skip':
                        // Skip this card - if it doesn't exist, don't add it;
                        // if it exists, keep the existing version (no change needed)
                        break;
                        
                    default:
                        console.warn(`No decision made for card ${incomingCard.id}, keeping existing or skipping`);
                }
            }
            
            // Convert map back to array
            mergedDeck.cards = Array.from(cardsMap.values());
            
            // Save the merged deck to database
            await nextDb.upsertDeck(mergedDeck);
            
            // Update the deck store to reflect the changes
            await nextDeckStore.selectDeck(mergedDeck.id);
            
            // Show success message
            toasts.success(`Deck "${mergedDeck.meta.title}" merged successfully!`);
            
            // Call completion callback if provided
            if (onMergeComplete) {
                onMergeComplete();
            }
            
            // Close dialog
            dialogStore.close();
            
        } catch (err) {
            console.error('Merge failed:', err);
            error = err instanceof Error ? err.message : 'Failed to merge decks';
        } finally {
            isMerging = false;
        }
    }
    
    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }
</script>

<div class="merge-tool-dialog">
    <div class="dialog-header">
        <h2>🔀 Merge Conflicts</h2>
        <button class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        <!-- Deck-level summary -->
        <div class="deck-summary">
            <h3>Deck Conflict Summary</h3>
            <div class="decks-comparison">
                <div class="deck-side">
                    <h4>📚 Existing Deck</h4>
                    <div class="deck-info">
                        <p><strong>{existingDeck.meta.title}</strong></p>
                        <p>{existingDeck.cards.length} cards</p>
                        <p>Modified {formatDate(existingDeck.meta.lastEdited)}</p>
                    </div>
                </div>
                <div class="deck-side">
                    <h4>📥 Incoming Deck</h4>
                    <div class="deck-info">
                        <p><strong>{incomingDeck.meta.title}</strong></p>
                        <p>{incomingDeck.cards.length} cards</p>
                        <p>Created {formatDate(incomingDeck.meta.createdAt)}</p>
                    </div>
                </div>
            </div>
            
            <div class="progress-info">
                <div class="progress-bar">
                    <div 
                        class="progress-fill" 
                        style="width: {canFinishMerge ? 100 : (mergeProgress / incomingDeck.cards.length) * 100}%"
                    ></div>
                </div>
                <p>Progress: {mergeProgress} / {incomingDeck.cards.length} cards resolved</p>
                {#if totalCards > 0}
                    <p class="conflict-summary">{conflictedCards.length} conflicts, {newCards.length} new cards</p>
                {:else}
                    <p class="no-conflicts">✅ No conflicts - all cards are identical</p>
                {/if}
            </div>
        </div>
        
        <!-- Merge mode selection -->
        <div class="merge-mode">
            <h3>Merge Mode</h3>
            <div class="mode-tabs">
                <button 
                    class="mode-tab" 
                    class:active={mergeMode === 'detailed'}
                    onclick={() => mergeMode = 'detailed'}
                >
                    🔍 Detailed Review
                </button>
                <button 
                    class="mode-tab" 
                    class:active={mergeMode === 'fast'}
                    onclick={() => mergeMode = 'fast'}
                >
                    ⚡ Fast Import
                </button>
            </div>
        </div>
        
        {#if mergeMode === 'fast'}
            <div class="fast-import">
                <h4>Fast Import Options</h4>
                <div class="fast-options">
                    <label class="radio-label">
                        <input 
                            type="radio" 
                            bind:group={fastImportChoice} 
                            value="accept"
                            onchange={handleFastImport}
                        />
                        <div class="radio-content">
                            <strong>Accept All Changes</strong>
                            <p>Replace existing cards and deck metadata with imported versions</p>
                        </div>
                    </label>
                    <label class="radio-label">
                        <input 
                            type="radio" 
                            bind:group={fastImportChoice} 
                            value="skip"
                            onchange={handleFastImport}
                        />
                        <div class="radio-content">
                            <strong>Skip All Changes</strong>
                            <p>Keep existing cards and metadata, ignore imported changes</p>
                        </div>
                    </label>
                </div>
            </div>
        {:else}
            <!-- Detailed card-by-card merge -->
            <div class="detailed-merge">
                {#if hasMetaConflicts}
                    <div class="meta-conflicts">
                        <h4>Deck Metadata Conflicts</h4>
                        <div class="conflict-items">
                            {#if existingDeck.meta.title !== incomingDeck.meta.title}
                                <div class="conflict-item">
                                    <span class="conflict-label">Title:</span>
                                    <div class="conflict-choices">
                                        <button 
                                            class="choice-button" 
                                            class:selected={deckMetaMergeDecisions.title === 'keep'}
                                            onclick={() => deckMetaMergeDecisions.title = 'keep'}
                                        >
                                            Keep: "{existingDeck.meta.title}"
                                        </button>
                                        <button 
                                            class="choice-button" 
                                            class:selected={deckMetaMergeDecisions.title === 'replace'}
                                            onclick={() => deckMetaMergeDecisions.title = 'replace'}
                                        >
                                            Use: "{incomingDeck.meta.title}"
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
                
                {#if totalCards === 0}
                    <div class="no-card-conflicts">
                        <h4>✅ No Card Conflicts</h4>
                        <p>All cards in the import are identical to existing cards or have been auto-resolved.</p>
                    </div>
                {:else if currentCard}
                    <div class="card-merge">
                        <div class="card-merge-header">
                            <h4>Card {currentCardIndex + 1} of {totalCards}</h4>
                            <div class="card-navigation">
                                <button 
                                    class="nav-button"
                                    onclick={goToPreviousCard}
                                    disabled={currentCardIndex === 0}
                                >
                                    ← Previous
                                </button>
                                <button 
                                    class="nav-button"
                                    onclick={goToNextCard}
                                    disabled={currentCardIndex === totalCards - 1}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                        
                        <div class="card-comparison">
                            <div class="card-side">
                                <h5>📚 Existing</h5>
                                {#if existingCard}
                                    <div class="card-preview">
                                        <p><strong>{existingCard.title}</strong></p>
                                        <p>{existingCard.subtitle}</p>
                                        <p>{existingCard.description}</p>
                                    </div>
                                {:else}
                                    <div class="card-preview new-card">
                                        <p><em>New card - doesn't exist in current deck</em></p>
                                    </div>
                                {/if}
                            </div>
                            
                            <div class="card-side">
                                <h5>📥 Incoming</h5>
                                <div class="card-preview">
                                    <p><strong>{currentCard.title}</strong></p>
                                    <p>{currentCard.subtitle}</p>
                                    <p>{currentCard.description}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="merge-decisions">
                            <h5>Choose Action:</h5>
                            <div class="decision-buttons">
                                <button 
                                    class="decision-button keep" 
                                    class:selected={cardMergeDecisions[currentCard.id] === 'keep'}
                                    onclick={() => setCardDecision('keep')}
                                >
                                    {existingCard ? 'Keep Existing' : 'Add New'}
                                </button>
                                {#if existingCard}
                                    <button 
                                        class="decision-button replace" 
                                        class:selected={cardMergeDecisions[currentCard.id] === 'replace'}
                                        onclick={() => setCardDecision('replace')}
                                    >
                                        Replace with Incoming
                                    </button>
                                {/if}
                                <button 
                                    class="decision-button skip" 
                                    class:selected={cardMergeDecisions[currentCard.id] === 'skip'}
                                    onclick={() => setCardDecision('skip')}
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
        
        {#if error}
            <div class="error">{error}</div>
        {/if}
        
        <!-- Actions -->
        <div class="merge-actions">
            <button 
                class="action-button secondary"
                onclick={() => dialogStore.close()}
                disabled={isMerging}
            >
                Cancel Import
            </button>
            <button 
                class="action-button primary"
                onclick={executeMerge}
                disabled={!canFinishMerge || isMerging}
            >
                {isMerging ? 'Merging...' : 'Complete Merge'}
            </button>
        </div>
    </div>
</div>

<style>
    .merge-tool-dialog {
        background: white;
        border-radius: 8px;
        max-width: 800px;
        width: 95vw;
        max-height: 90vh;
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
    
    .deck-summary h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .decks-comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .deck-side h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 500;
    }
    
    .deck-info {
        background: var(--ui-hover-bg, #f8fafc);
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.875rem;
    }
    
    .deck-info p {
        margin: 0.25rem 0;
    }
    
    .progress-info {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 6px;
        padding: 1rem;
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
    
    .progress-info p {
        margin: 0;
        font-size: 0.875rem;
        text-align: center;
    }
    
    .conflict-summary {
        color: var(--ui-muted, #64748b) !important;
        font-size: 0.75rem !important;
    }
    
    .no-conflicts {
        color: var(--ui-success, #059669) !important;
        font-weight: 500 !important;
    }
    
    .no-card-conflicts {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
        border: 1px solid rgba(34, 197, 94, 0.2);
        border-radius: 6px;
        padding: 1rem;
        text-align: center;
    }
    
    .no-card-conflicts h4 {
        margin: 0 0 0.5rem 0;
        color: var(--ui-success, #059669);
        font-size: 1rem;
    }
    
    .no-card-conflicts p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
    }
    
    .merge-mode h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .mode-tabs {
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .mode-tab {
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }
    
    .mode-tab:hover {
        color: var(--ui-text, #1a202c);
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .mode-tab.active {
        color: var(--button-primary-bg, #3b82f6);
        border-bottom-color: var(--button-primary-bg, #3b82f6);
    }
    
    .fast-import h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 500;
    }
    
    .fast-options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .radio-label {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .radio-label:hover {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .radio-content strong {
        display: block;
        margin-bottom: 0.25rem;
    }
    
    .radio-content p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
    }
    
    .card-merge-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .card-merge-header h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
    }
    
    .card-navigation {
        display: flex;
        gap: 0.5rem;
    }
    
    .nav-button {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .nav-button:hover:not(:disabled) {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .nav-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .card-comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .card-side h5 {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .card-preview {
        background: var(--ui-hover-bg, #f8fafc);
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.875rem;
    }
    
    .card-preview.new-card {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
        border: 1px solid rgba(34, 197, 94, 0.2);
    }
    
    .card-preview p {
        margin: 0.25rem 0;
    }
    
    .merge-decisions h5 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .decision-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .decision-button {
        padding: 0.5rem 0.75rem;
        border: 2px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .decision-button:hover {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .decision-button.selected {
        border-color: var(--button-primary-bg, #3b82f6);
        background: var(--button-primary-bg, #3b82f6);
        color: white;
    }
    
    .merge-actions {
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
    
    @media (max-width: 768px) {
        .decks-comparison,
        .card-comparison {
            grid-template-columns: 1fr;
        }
        
        .card-merge-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: stretch;
        }
        
        .merge-actions {
            flex-direction: column;
        }
    }
</style>
