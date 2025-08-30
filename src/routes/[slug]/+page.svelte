<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { importFromUrl } from '$lib/next/utils/shareUrlUtils.js';
    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { toasts } from '$lib/stores/toast.js';
    
    let importing = $state(true);
    let error = $state<string | null>(null);
    let imported = $state(false);
    
    onMount(async () => {
        try {
            // Get the current URL with hash
            const currentUrl = window.location.href;
            
            // Try to import deck from the URL
            const deck = importFromUrl(currentUrl);
            
            if (deck) {
                // Success! Import the deck into the store (save to DB first)
                await nextDeckStore.importDeck(deck);
                
                imported = true;
                toasts.success(`🎉 Deck "${deck.meta.title}" imported from URL!`);
                
                // Clear the URL hash to prevent re-importing
                window.history.replaceState({}, '', window.location.pathname);
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
    
    // Extract the slug for display
    let slug = $derived($page.params.slug || '');
    let decodedSlug = $derived(decodeURIComponent(slug));
</script>

<div class="import-page">
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
</style>
