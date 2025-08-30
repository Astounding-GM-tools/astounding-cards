<script lang="ts">
    import { onMount } from 'svelte';
    import { goto, replaceState } from '$app/navigation';
    import { page } from '$app/stores';
    import { importFromUrl } from '$lib/next/utils/shareUrlUtils.js';
    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.ts';
    import { nextDb } from '$lib/next/stores/database.js';
    import { toasts } from '$lib/stores/toast.js';
    import { 
        detectDeckConflict, 
        type DeckConflict, 
        type MergeResolution, 
        applyMergeResolution 
    } from '$lib/next/utils/deckMerging.js';
    import MergeTool from '$lib/next/components/merge/MergeTool.svelte';
    import type { Deck } from '$lib/next/types/deck.js';
    
    let importing = $state(true);
    let error = $state<string | null>(null);
    let imported = $state(false);
    let showMergeTool = $state(false);
    let conflict = $state<DeckConflict | null>(null);
    let importedDeck = $state<Deck | null>(null);
    
    onMount(async () => {
        try {
            // Ensure we're in the browser before accessing window
            if (typeof window === 'undefined') {
                error = 'Import functionality requires browser environment';
                return;
            }
            
            // Get the current URL with hash
            const currentUrl = window.location.href;
            // Try to import deck from the URL
            const deck = importFromUrl(currentUrl);
            
            if (deck) {
                importedDeck = deck;
                
                // Check if a deck with the same ID already exists
                const existingDeck = await nextDb.getDeck(deck.id);
                
                if (existingDeck) {
                    // Conflict detected! Show merge tool
                    const detectedConflict = detectDeckConflict(existingDeck, deck);
                    
                    if (detectedConflict) {
                        conflict = detectedConflict;
                        showMergeTool = true;
                        toasts.info(`⚠️ Deck "${deck.meta.title}" already exists. Please resolve conflicts.`);
                    } else {
                        // No conflicts, just import directly
                        await nextDeckStore.importDeck(deck);
                        imported = true;
                        toasts.success(`🎉 Deck "${deck.meta.title}" imported from URL!`);
                    }
                } else {
                    // No existing deck, import directly
                    await nextDeckStore.importDeck(deck);
                    imported = true;
                    toasts.success(`🎉 Deck "${deck.meta.title}" imported from URL!`);
                }
                
                // Clear the URL hash to prevent re-importing
                replaceState(window.location.pathname, {});
            } else {
                error = 'Invalid share URL - could not decode deck data';
                toasts.error('Failed to import deck from URL');
            }
        } catch (err) {
            console.error('Import error:', err);
            error = err instanceof Error ? err.message : 'Failed to import deck';
            toasts.error('Failed to import deck from URL');
        } finally {
            importing = false;
        }
    });
    
    // Handle merge resolution
    async function handleMergeResolve(resolution: MergeResolution) {
        if (!conflict || !importedDeck) return;
        
        try {
            // Apply the merge resolution to create the final deck
            const mergedDeck = applyMergeResolution(resolution);
            
            // Save the merged deck (will overwrite existing)
            await nextDb.upsertDeck(mergedDeck);
            
            // Load it into the store
            await nextDeckStore.loadDeck(mergedDeck.id);
            
            // Update state
            showMergeTool = false;
            imported = true;
            conflict = null;
            
            toasts.success(`🔀 Deck "${mergedDeck.meta.title}" merged successfully!`);
        } catch (err) {
            console.error('Merge error:', err);
            error = err instanceof Error ? err.message : 'Failed to merge deck';
            toasts.error('Failed to merge deck');
        }
    }
    
    // Handle merge cancellation
    function handleMergeCancel() {
        showMergeTool = false;
        conflict = null;
        importedDeck = null;
        
        // Go back to the app
        goto('/next');
    }
    
    // Extract the slug for display
    let slug = $derived($page.params.slug || '');
    let decodedSlug = $derived(decodeURIComponent(slug));
</script>

<div class="import-page">
    {#if showMergeTool && conflict}
        <!-- Full-screen merge tool -->
        <div class="merge-container">
            <MergeTool 
                {conflict}
                onResolve={handleMergeResolve}
                onCancel={handleMergeCancel}
            />
        </div>
    {:else}
        <!-- Standard import states -->
        <div class="import-content">
            {#if importing}
                <div class="importing">
                    <div class="spinner"></div>
                    <h2>🔗 Importing Deck</h2>
                    <p>Decoding share URL...</p>
                    {#if decodedSlug}
                        <p class="slug">"{decodedSlug}"</p>
                    {/if}
                </div>
            {:else if imported}
                <div class="success">
                    <div class="checkmark">✅</div>
                    <h2>🎉 Import Successful!</h2>
                    <p>Deck imported and saved to your library.</p>
                    <button 
                        class="success-button"
                        onclick={() => goto('/next')}
                    >
                        Open Deck
                    </button>
                </div>
            {:else if error}
                <div class="error">
                    <div class="error-icon">❌</div>
                    <h2>Import Failed</h2>
                    <p>{error}</p>
                    <button 
                        class="retry-button"
                        onclick={() => goto('/next')}
                    >
                        Go to App
                    </button>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .import-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ui-bg, #ffffff);
        font-family: var(--ui-font-family, system-ui);
    }
    
    .import-content {
        text-align: center;
        padding: 2rem;
        max-width: 400px;
    }
    
    .importing, .success, .error {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }
    
    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--ui-border, #e2e8f0);
        border-top: 3px solid var(--button-primary-bg, #3b82f6);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .checkmark {
        font-size: 3rem;
        animation: bounce 0.6s ease-out;
    }
    
    @keyframes bounce {
        0% { transform: scale(0.3); }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }
    
    .error-icon {
        font-size: 3rem;
        color: var(--toast-error, #dc2626);
    }
    
    h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--ui-text, #1a202c);
    }
    
    p {
        margin: 0;
        color: var(--ui-muted, #64748b);
        line-height: 1.5;
    }
    
    .slug {
        font-family: monospace;
        background: var(--ui-hover-bg, #f8fafc);
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.9rem;
        word-break: break-all;
        border: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .retry-button,
    .success-button {
        padding: 0.75rem 1.5rem;
        background: var(--button-primary-bg, #3b82f6);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .retry-button:hover,
    .success-button:hover {
        background: var(--button-primary-hover-bg, #2563eb);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .success-button {
        background: var(--toast-success, #10b981);
    }
    
    .success-button:hover {
        background: var(--toast-success, #059669);
    }
    
    .merge-container {
        width: 100vw;
        min-height: 100vh;
        padding: 2rem;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        background: var(--ui-bg, #ffffff);
        overflow-y: auto;
    }
    
    /* Responsive merge container */
    @media (max-width: 640px) {
        .merge-container {
            padding: 1rem;
        }
    }
</style>
