<script lang="ts">
    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import { 
        DeckManagerDialog,
        CardEditDialog,
        ShareUrlDialog,
        JsonExportDialog,
        JsonImportDialog
    } from '../dialogs/index.js';
    import BinaryToggle from '../ui/BinaryToggle.svelte';
    import type { Layout } from '../../types/deck.js';
    
    // Derived state from store
    let deck = $derived(nextDeckStore.deck);
    let cardCount = $derived(deck?.cards?.length || 0);
    let deckTitle = $derived(deck?.meta.title || 'No Deck');
    let isLoading = $derived(nextDeckStore.isLoading);
    let currentLayout = $derived(deck?.meta.layout || 'tarot');
    
    // Handle layout toggle with persistence
    async function handleLayoutToggle(isTarot: boolean) {
        const newLayout: Layout = isTarot ? 'tarot' : 'poker';
        await nextDeckStore.updateLayout(newLayout);
    }
    
    // Handle manage decks
    function handleManageDecks() {
        dialogStore.setContent(DeckManagerDialog);
    }
    
    // Handle add card
    async function handleAddCard() {
        // Create a new card with template content in the database
        const newCard = await nextDeckStore.addCard();
        if (newCard) {
            // The card will appear on the page automatically due to reactive updates
            // Now open the edit dialog for the newly created card so user can customize it
            dialogStore.setContent(CardEditDialog, { cardId: newCard.id });
        }
    }
    
    // Handle share deck
    function handleShareDeck() {
        if (!deck) return;
        dialogStore.setContent(ShareUrlDialog, { deck });
    }
    
    // Handle export deck
    function handleExportDeck() {
        if (!deck) return;
        dialogStore.setContent(JsonExportDialog, { deck });
    }
    
    // Handle import deck
    function handleImportDeck() {
        dialogStore.setContent(JsonImportDialog);
    }
    
    // Dev functions (temporary)
    async function handleLoadSample() {
        try {
            await nextDevStore.setupTestEnvironment();
        } catch (error) {
            console.error('Error loading sample data:', error);
        }
    }
    
    async function handleClearDatabase() {
        try {
            await nextDevStore.clearDatabase();
        } catch (error) {
            console.error('Error clearing database:', error);
        }
    }
</script>

<header class="app-header">
    <div class="header-top">
        <div class="header-left">
            <h1 class="deck-title">{deckTitle}</h1>
            <div class="deck-info">
                <span class="card-count">{cardCount} cards</span>
                {#if deck}
                    <div class="layout-info">
                        <span class="layout-label">Layout:</span>
                        <BinaryToggle
                            checked={currentLayout === 'tarot'}
                            onToggle={handleLayoutToggle}
                            trueLabel="🀜 Tarot"
                            falseLabel="🀡 Poker"
                            disabled={isLoading}
                            name="card-layout"
                            size="sm"
                        />
                    </div>
                {/if}
            </div>
        </div>
        
        <div class="header-right">
            <button 
                class="action-button primary"
                onclick={handleManageDecks}
                disabled={isLoading}
            >
                📚 Manage Decks
            </button>
            
            {#if deck}
                <button 
                    class="action-button"
                    onclick={handleAddCard}
                    disabled={isLoading}
                >
                    ➕ Add Card
                </button>
                
                <button 
                    class="action-button"
                    onclick={handleShareDeck}
                    disabled={isLoading}
                >
                    🔗 Share
                </button>
            {/if}
        </div>
    </div>
    
    <div class="header-controls">
        <!-- Dev controls - remove in production -->
        <div class="dev-controls">
            <button 
                class="dev-button"
                onclick={handleLoadSample}
                disabled={isLoading}
            >
                Load Sample
            </button>
            <button 
                class="dev-button danger"
                onclick={handleClearDatabase}
                disabled={isLoading}
            >
                Clear DB
            </button>
        </div>
    </div>
</header>

<style>
    .app-header {
        background: var(--ui-bg, #ffffff);
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        padding: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .header-left {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
    }
    
    .deck-title {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0;
        color: var(--ui-text, #1a202c);
        line-height: 1.2;
        word-wrap: break-word;
    }
    
    .deck-info {
        display: flex;
        gap: 1rem;
        align-items: center;
        color: var(--ui-muted, #64748b);
        font-size: 0.875rem;
    }
    
    .card-count {
        font-weight: 500;
    }
    
    .layout-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .layout-label {
        font-weight: 500;
        color: var(--ui-text, #1a202c);
    }
    
    .header-right {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-shrink: 0;
    }
    
    .action-button {
        padding: 0.75rem 1rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    
    .action-button:hover:not(:disabled) {
        background: var(--ui-hover-bg, #f8fafc);
        border-color: var(--button-primary-bg, #3b82f6);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .action-button.primary {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
        border-color: var(--button-primary-bg, #3b82f6);
    }
    
    .action-button.primary:hover:not(:disabled) {
        background: var(--button-primary-hover-bg, #2563eb);
        border-color: var(--button-primary-hover-bg, #2563eb);
    }
    
    .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    
    .header-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .layout-controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .control-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--ui-text, #1a202c);
    }
    
    .dev-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .dev-button {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .dev-button:hover:not(:disabled) {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .dev-button.danger {
        color: var(--toast-error, #dc2626);
        border-color: var(--toast-error, #dc2626);
    }
    
    .dev-button.danger:hover:not(:disabled) {
        background: var(--toast-error, #dc2626);
        color: white;
    }
    
    .dev-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
        .header-top {
            flex-direction: column;
            align-items: stretch;
        }
        
        .header-right {
            justify-content: flex-start;
            flex-wrap: wrap;
        }
        
        .header-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
        }
        
        .layout-controls, .dev-controls {
            justify-content: center;
        }
    }
    
    @media (max-width: 480px) {
        .app-header {
            padding: 0.75rem;
        }
        
        .deck-title {
            font-size: 1.5rem;
        }
        
        .action-button {
            padding: 0.625rem 0.875rem;
            font-size: 0.8125rem;
        }
    }
</style>
