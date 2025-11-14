<script lang="ts">
    import { onMount } from 'svelte';
    import { goto, replaceState } from '$app/navigation';
    import { page } from '$app/stores';
    import { track } from '@vercel/analytics';
    import { importFromUrl } from '$lib/next/utils/shareUrlUtils.js';
    import { performThreeLayerMerge } from '$lib/next/utils/threeLayerMerge.js';
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
    import type { PageData } from './$types';
    
    // Server-side data
    let { data }: { data: PageData } = $props();
    
    
    let importing = $state(true);
    let error = $state<string | null>(null);
    let imported = $state(false);
    let showMergeTool = $state(false);
    let conflict = $state<DeckConflict | null>(null);
    let importedDeck = $state<Deck | null>(null);
    
    onMount(async () => {
        // Track shared deck access with Vercel Web Analytics
        try {
            track('shared_deck_accessed', {
                slug: data.slug,
                curated: !!data.curatedDeck,
                timestamp: new Date().toISOString(),
                referrer: document.referrer || 'direct'
            });
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
        }
        
        try {
            if (typeof window === 'undefined') {
                error = 'Import functionality requires browser environment';
                return;
            }
            
            // THREE-LAYER MERGE SYSTEM
            // Layer 1: Curated deck from Supabase (if present)
            const curatedDeck = data.curatedDeck;
            
            // Layer 2: Hash data from URL (shared modifications)
            const hashDeck = importFromUrl(window.location.href);
            
            // Layer 3: Local deck from IndexedDB (if exists)
            let localDeck: Deck | null = null;
            if (curatedDeck) {
                // Check if user has a local copy of this curated deck
                localDeck = await nextDb.getDeck(curatedDeck.id);
            } else if (hashDeck) {
                // Check if user has a local copy of the hash deck
                localDeck = await nextDb.getDeck(hashDeck.id);
            }
            
            // Perform the three-layer merge
            if (curatedDeck || hashDeck) {
                const mergeResult = performThreeLayerMerge(curatedDeck, hashDeck, localDeck);
                
                importedDeck = mergeResult.deck;
                
                if (mergeResult.hasConflict && mergeResult.conflict) {
                    // Conflict detected - show merge tool
                    conflict = mergeResult.conflict;
                    showMergeTool = true;
                    toasts.info(`⚠️ Deck "${mergeResult.deck.meta.title}" has local changes. Please resolve conflicts.`);
                } else {
                    // No conflict - import the merged deck
                    await nextDeckStore.importDeck(mergeResult.deck);
                    imported = true;
                    
                    // Show appropriate success message based on layers
                    if (mergeResult.layers.curated && mergeResult.layers.local) {
                        toasts.success(`🎉 Using your local version of "${mergeResult.deck.meta.title}"`);
                    } else if (mergeResult.layers.curated) {
                        toasts.success(`🎉 Curated deck "${mergeResult.deck.meta.title}" imported!`);
                    } else {
                        toasts.success(`🎉 Deck "${mergeResult.deck.meta.title}" imported from URL!`);
                    }
                }
                
                // Clear the URL hash to prevent re-importing
                if (hashDeck) {
                    replaceState(window.location.pathname + (data.curatedId ? `?curated=${data.curatedId}` : ''), {});
                }
            } else {
                error = 'No deck data found in URL';
                toasts.error('No deck data found');
            }
        } catch (err) {
            console.error('Import error:', err);
            error = err instanceof Error ? err.message : 'Failed to import deck';
            toasts.error('Failed to import deck');
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
