<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
    import { toasts } from '$lib/stores/toast.js';
    import ApiKeyInput from '../ui/ApiKeyInput.svelte';
    
    // Local state
    let apiKey = $state('');
    let selectedArtStyle = $state('classic');
    let isGenerating = $state(false);
    
    // Get current deck from store
    let currentDeck = $derived(nextDeckStore.deck);
    let totalCards = $derived(currentDeck?.cards.length || 0);
    
    // Generate images for all cards in parallel
    async function generateAllImages() {
        isGenerating = true;
        
        // Close dialog immediately - user will see progress via toasts and card updates
        dialogStore.close();
        
        try {
            // Import the AiImageGenerator class
            const { AiImageGenerator } = await import('$lib/utils/ai-image-generator.js');
            const generator = new AiImageGenerator();
            
            // Show initial toast
            toasts.success(`🚀 Starting batch image generation for ${totalCards} cards!`);
            
            // Fire off all requests in parallel - let Google handle it!
            const imagePromises = currentDeck!.cards.map(async (card, index) => {
                try {
                    // Generate image for this card (with batch flag to skip auto-downloads)
                    const result = await generator.generateCardImage(card, selectedArtStyle, apiKey, true);
                    
                    if (result.success && result.imageBlob) {
                        // Update the card with the new image using the deck store
                        await nextDeckStore.updateCard(card.id, {
                            imageBlob: result.imageBlob,
                            image: result.sourceUrl || null,
                            imageMetadata: {
                                originalName: result.filename || 'ai-generated-image',
                                addedAt: Date.now(),
                                source: 'ai-generation',
                                size: result.imageBlob.size
                            }
                        });
                        
                        toasts.success(`✨ Generated image for "${card.title}" (${index + 1}/${totalCards})`);
                    } else {
                        toasts.error(`❌ Failed to generate image for "${card.title}": ${result.error || 'Unknown error'}`);
                    }
                    
                    return { cardId: card.id, success: result.success };
                } catch (error) {
                    console.error(`Error generating image for card ${card.title}:`, error);
                    toasts.error(`❌ Error generating image for "${card.title}"`);
                    return { cardId: card.id, success: false };
                }
            });
            
            // Wait for all promises to settle (not fail-fast)
            const results = await Promise.allSettled(imagePromises);
            
            // Count successes and failures
            const successful = results.filter(result => 
                result.status === 'fulfilled' && result.value.success
            ).length;
            const failed = totalCards - successful;
            
            // Show final summary
            if (failed === 0) {
                toasts.success(`🎉 Batch generation complete! Generated ${successful} images successfully!`);
            } else {
                toasts.warning(`⚠️ Batch generation complete: ${successful} successful, ${failed} failed`);
            }
            
        } catch (error) {
            console.error('Batch image generation error:', error);
            toasts.error('Error during batch image generation. Please check your API key.');
        } finally {
            isGenerating = false;
        }
    }
</script>

<div class="batch-image-dialog">
    <div class="dialog-header">
        <h2>🖼️ Generate All Images</h2>
        <button type="button" class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        <div class="info-section">
            <h3>Batch AI Image Generation</h3>
            <p class="description">
                Generate AI images for all cards in your deck simultaneously. This will fire all requests in parallel for maximum speed!
            </p>
            
            <div class="deck-stats">
                <div class="stat">
                    <span class="stat-number">{totalCards}</span>
                    <span class="stat-label">Total Cards</span>
                </div>
            </div>
            
            <div class="warning-note">
                <p><strong>Note:</strong> This will replace ALL existing images in the deck. The dialog will close immediately and you'll see progress via toasts and real-time card updates.</p>
            </div>
        </div>
        
        <div class="art-style-section">
            <label for="art-style-select" class="art-style-label">Art Style:</label>
            <select 
                id="art-style-select"
                bind:value={selectedArtStyle}
                class="art-style-select"
            >
                <option value="classic">Classic (pencil sketch with color details)</option>
                <option value="modern">Modern (clean digital photography)</option>
            </select>
        </div>
        
        <div class="api-section">
            <ApiKeyInput
                {apiKey}
                onApiKeyChange={(key: string) => apiKey = key}
                onSubmit={generateAllImages}
                isProcessing={isGenerating}
                submitButtonText="🚀 Generate All Images"
                processingButtonText="🚀 Generating..."
                placeholder="Paste your Google AI Studio API key here"
            />
            
            <div class="api-key-info">
                <p class="security-note">
                    🔒 Your API key is sent directly to Google AI Studio. We don't store or log it.
                    <a href="https://aistudio.google.com/apikey" target="_blank" class="inline-link">Get your Google API key →</a>
                </p>
            </div>
        </div>
    </div>
    
    <div class="dialog-footer">
        <button 
            type="button"
            class="footer-button secondary"
            onclick={() => dialogStore.close()}
        >
            Cancel
        </button>
    </div>
</div>

<style>
    .batch-image-dialog {
        background: white;
        border-radius: 8px;
        max-width: 500px;
        width: 90vw;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
    }
    
    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
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
    
    .info-section h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .description {
        color: var(--ui-muted, #64748b);
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }
    
    .deck-stats {
        display: flex;
        justify-content: center;
        margin-bottom: 1.5rem;
    }
    
    .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: var(--button-primary-bg, #3b82f6);
        line-height: 1;
    }
    
    .stat-label {
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
        font-weight: 500;
        margin-top: 0.25rem;
    }
    
    .warning-note {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .warning-note p {
        margin: 0;
        color: #d97706;
        font-size: 0.875rem;
        line-height: 1.4;
    }
    
    .art-style-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .art-style-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--ui-text, #1a202c);
    }
    
    .art-style-select {
        padding: 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        font-family: inherit;
        cursor: pointer;
        transition: border-color 0.2s;
    }
    
    .art-style-select:focus {
        outline: none;
        border-color: var(--button-primary-bg, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .art-style-select:hover {
        border-color: var(--button-primary-bg, #3b82f6);
    }
    
    .api-key-info {
        margin-top: 0.75rem;
    }
    
    .security-note {
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
        line-height: 1.4;
        margin: 0;
    }
    
    .inline-link {
        color: var(--button-primary-bg, #3b82f6);
        text-decoration: underline;
        font-weight: 500;
    }
    
    .inline-link:hover {
        color: var(--button-primary-hover-bg, #2563eb);
    }
    
    .dialog-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--ui-border, #e2e8f0);
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }
    
    .footer-button {
        padding: 0.5rem 1rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .footer-button:hover {
        background: var(--ui-hover-bg, #f8fafc);
    }
</style>
