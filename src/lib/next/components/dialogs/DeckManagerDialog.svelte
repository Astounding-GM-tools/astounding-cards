<script lang="ts">
    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { nextDb } from '$lib/next/stores/database.js';
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import type { Deck } from '$lib/next/types/deck.js';
    
    // Local state
    let availableDecks = $state<Deck[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let showCreateForm = $state(false);
    let showDeleteConfirm = $state<string | null>(null);
    let newDeckName = $state('');
    let editingDeckId = $state<string | null>(null);
    let editingDeckName = $state('');
    
    // Current deck from store
    let currentDeck = $derived(nextDeckStore.deck);
    
    // Load available decks on mount
    async function loadDecks() {
        isLoading = true;
        error = null;
        
        try {
            const decks = await nextDb.getAllDecks();
            availableDecks = decks;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load decks';
        } finally {
            isLoading = false;
        }
    }
    
    // Initialize when component mounts
    $effect(() => {
        loadDecks();
    });
    
    // Handle deck selection
    async function selectDeck(deckId: string) {
        const success = await nextDeckStore.loadDeck(deckId);
        if (success) {
            dialogStore.close();
        }
    }
    
    // Handle new deck creation
    async function createDeck() {
        const name = newDeckName.trim();
        if (!name) return;
        
        const success = await nextDeckStore.createDeck(name);
        if (success) {
            newDeckName = '';
            showCreateForm = false;
            await loadDecks(); // Refresh list
        }
    }
    
    // Handle deck deletion
    async function deleteDeck(deckId: string) {
        try {
            await nextDb.deleteDeck(deckId);
            
            // If we just deleted the current deck, clear it
            if (currentDeck?.id === deckId) {
                nextDeckStore.clearDeck();
            }
            
            await loadDecks(); // Refresh list
            showDeleteConfirm = null;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to delete deck';
        }
    }
    
    // Handle deck renaming
    async function startEditingName(deck: Deck) {
        editingDeckId = deck.id;
        editingDeckName = deck.meta.title;
    }
    
    async function saveEditedName() {
        if (!editingDeckId || !editingDeckName.trim()) return;
        
        try {
            await nextDb.updateDeckMeta(editingDeckId, { title: editingDeckName.trim() });
            
            // If we just renamed the current deck, update it
            if (currentDeck?.id === editingDeckId) {
                await nextDeckStore.loadDeck(editingDeckId);
            }
            
            await loadDecks(); // Refresh list
            editingDeckId = null;
            editingDeckName = '';
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to rename deck';
        }
    }
    
    function cancelEditing() {
        editingDeckId = null;
        editingDeckName = '';
    }
    
    // Format date for display
    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleDateString();
    }
    
    function formatDateTime(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }
</script>

<div class="deck-manager-dialog">
    <div class="dialog-header">
        <h2>📚 Deck Management</h2>
        <button class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        {#if isLoading}
            <div class="loading">Loading decks...</div>
        {:else if error}
            <div class="error">{error}</div>
        {:else if availableDecks.length === 0}
            <div class="empty-state">
                <p>No decks found. Create your first deck to get started!</p>
            </div>
        {:else}
            <div class="deck-list">
                {#each availableDecks as deck (deck.id)}
                    <div class="deck-item" class:current={currentDeck?.id === deck.id}>
                        {#if editingDeckId === deck.id}
                            <div class="deck-edit">
                                <input
                                    type="text"
                                    bind:value={editingDeckName}
                                    class="deck-name-input"
                                    onkeydown={(e) => {
                                        if (e.key === 'Enter') saveEditedName();
                                        if (e.key === 'Escape') cancelEditing();
                                    }}
                                />
                                <button class="save-button" onclick={saveEditedName}>✓</button>
                                <button class="cancel-button" onclick={cancelEditing}>×</button>
                            </div>
                        {:else}
                            <div class="deck-info">
                                <div class="deck-main">
                                    <h3 class="deck-title">{deck.meta.title}</h3>
                                    <div class="deck-meta">
                                        <span class="card-count">{deck.cards.length} cards</span>
                                        <span class="deck-date">Created {formatDate(deck.meta.createdAt)}</span>
                                        {#if deck.meta.lastEdited !== deck.meta.createdAt}
                                            <span class="deck-date">Modified {formatDateTime(deck.meta.lastEdited)}</span>
                                        {/if}
                                    </div>
                                </div>
                                
                                <div class="deck-actions">
                                    {#if currentDeck?.id !== deck.id}
                                        <button 
                                            class="action-button select" 
                                            onclick={() => selectDeck(deck.id)}
                                        >
                                            Select
                                        </button>
                                    {:else}
                                        <span class="current-indicator">Current</span>
                                    {/if}
                                    
                                    <button 
                                        class="action-button edit" 
                                        onclick={() => startEditingName(deck)}
                                        title="Rename deck"
                                    >
                                        ✎
                                    </button>
                                    
                                    <button 
                                        class="action-button delete" 
                                        onclick={() => showDeleteConfirm = deck.id}
                                        title="Delete deck"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
        
        <!-- Create new deck section -->
        <div class="create-section">
            {#if showCreateForm}
                <div class="create-form">
                    <input
                        type="text"
                        bind:value={newDeckName}
                        placeholder="Enter deck name"
                        class="new-deck-input"
                        onkeydown={(e) => {
                            if (e.key === 'Enter') createDeck();
                            if (e.key === 'Escape') {
                                showCreateForm = false;
                                newDeckName = '';
                            }
                        }}
                    />
                    <button class="action-button create" onclick={createDeck}>Create</button>
                    <button class="action-button cancel" onclick={() => {
                        showCreateForm = false;
                        newDeckName = '';
                    }}>Cancel</button>
                </div>
            {:else}
                <button class="action-button primary" onclick={() => showCreateForm = true}>
                    ➕ New Deck
                </button>
            {/if}
        </div>
    </div>
</div>

<!-- Delete confirmation overlay -->
{#if showDeleteConfirm}
    {@const deckToDelete = availableDecks.find(d => d.id === showDeleteConfirm)}
    <div class="overlay" role="button" tabindex="0" onclick={() => showDeleteConfirm = null} onkeydown={(e) => e.key === 'Escape' && (showDeleteConfirm = null)}></div>
    <div class="confirm-dialog">
        <h3>Delete Deck?</h3>
        <p>Are you sure you want to delete "<strong>{deckToDelete?.meta.title}</strong>"?</p>
        <p class="warning">This will permanently delete all {deckToDelete?.cards.length} cards in the deck.</p>
        <div class="confirm-actions">
            <button class="action-button danger" onclick={() => deleteDeck(showDeleteConfirm!)}>
                Delete Forever
            </button>
            <button class="action-button cancel" onclick={() => showDeleteConfirm = null}>
                Cancel
            </button>
        </div>
    </div>
{/if}

<style>
    .deck-manager-dialog {
        background: white;
        border-radius: 8px;
        max-width: 600px;
        width: 90vw;
        max-height: 80vh;
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
    
    .loading, .error {
        text-align: center;
        padding: 2rem;
        color: var(--ui-muted, #64748b);
    }
    
    .error {
        color: var(--toast-error, #dc2626);
    }
    
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--ui-muted, #64748b);
    }
    
    .deck-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .deck-item {
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        overflow: hidden;
        transition: border-color 0.2s;
    }
    
    .deck-item.current {
        border-color: var(--button-primary-bg, #3b82f6);
        background: var(--button-primary-bg, #3b82f6);
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
    }
    
    .deck-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
    }
    
    .deck-main {
        flex: 1;
    }
    
    .deck-title {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
    }
    
    .deck-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
        flex-wrap: wrap;
    }
    
    .card-count {
        font-weight: 500;
    }
    
    .deck-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-shrink: 0;
    }
    
    .current-indicator {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--button-primary-bg, #3b82f6);
        padding: 0.25rem 0.75rem;
    }
    
    .deck-edit {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
    }
    
    .deck-name-input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 600;
    }
    
    .action-button {
        padding: 0.5rem 0.75rem;
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
    
    .action-button.select {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
        border-color: var(--button-primary-bg, #3b82f6);
    }
    
    .action-button.select:hover {
        background: var(--button-primary-hover-bg, #2563eb);
    }
    
    .action-button.edit {
        padding: 0.5rem;
        min-width: 2rem;
        text-align: center;
    }
    
    .action-button.delete {
        color: var(--toast-error, #dc2626);
        border-color: var(--toast-error, #dc2626);
    }
    
    .action-button.delete:hover {
        background: var(--toast-error, #dc2626);
        color: white;
    }
    
    .action-button.danger {
        background: var(--toast-error, #dc2626);
        color: white;
        border-color: var(--toast-error, #dc2626);
    }
    
    .action-button.danger:hover {
        background: #b91c1c;
    }
    
    .save-button, .cancel-button {
        padding: 0.5rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        background: var(--ui-bg, #ffffff);
        cursor: pointer;
        min-width: 2rem;
        text-align: center;
    }
    
    .save-button {
        color: var(--button-primary-bg, #3b82f6);
        border-color: var(--button-primary-bg, #3b82f6);
    }
    
    .save-button:hover {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
    }
    
    .cancel-button:hover {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .create-section {
        border-top: 1px solid var(--ui-border, #e2e8f0);
        padding-top: 1.5rem;
    }
    
    .create-form {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .new-deck-input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 0.875rem;
    }
    
    /* Confirmation dialog overlay */
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
    }
    
    .confirm-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        max-width: 400px;
        width: 90vw;
        z-index: 1001;
    }
    
    .confirm-dialog h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .confirm-dialog p {
        margin: 0 0 1rem 0;
        color: var(--ui-text, #1a202c);
    }
    
    .warning {
        color: var(--toast-error, #dc2626);
        font-weight: 500;
        font-size: 0.875rem;
    }
    
    .confirm-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
    }
    
    /* Responsive design */
    @media (max-width: 480px) {
        .deck-manager-dialog {
            width: 95vw;
            max-height: 85vh;
        }
        
        .dialog-header, .dialog-content {
            padding: 1rem;
        }
        
        .deck-info {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }
        
        .deck-actions {
            justify-content: flex-end;
        }
        
        .create-form {
            flex-direction: column;
            align-items: stretch;
        }
    }
</style>
