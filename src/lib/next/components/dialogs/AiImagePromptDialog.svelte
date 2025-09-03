<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import { generateImagePrompt } from '../../utils/aiImagePrompt.js';
    import { toasts } from '$lib/stores/toast.js';
    import { browser } from '$app/environment';
    import type { Card } from '../../types/card.js';
    
    interface Props {
        card: Card;
        deckTheme?: string;
    }
    
    let { card, deckTheme = 'fantasy' }: Props = $props();
    
    // State
    let prompt = $state('');
    let processedPrompt = $state('');
    let isGenerating = $state(false);
    let isProcessing = $state(false);
    let apiKey = $state('');
    let showApiKeySection = $state(false);
    let apiKeyValid = $state(false);
    
    // Generate prompt automatically when dialog opens
    $effect(() => {
        generatePrompt();
    });
    
    function generatePrompt() {
        isGenerating = true;
        
        // Small delay for UX
        setTimeout(() => {
            prompt = generateImagePrompt(card, deckTheme);
            isGenerating = false;
        }, 200);
    }
    
    async function processPromptWithGemini() {
        if (!browser) {
            toasts.error('This feature is only available in the browser');
            return;
        }
        
        if (!apiKey.trim()) {
            toasts.error('Please enter your Google AI Studio API key first');
            return;
        }
        
        isProcessing = true;
        
        try {
            // Dynamically import the Gemini processing function only in browser
            const { processPromptForContentFiltering } = await import('$lib/ai/index.js');
            const result = await processPromptForContentFiltering(apiKey, prompt);
            
            if (result.success && result.result) {
                processedPrompt = result.result;
                toasts.success('🎯 Prompt processed successfully! This version should avoid content filters.');
            } else {
                toasts.error(`Failed to process prompt: ${result.error}`);
                if (result.error?.includes('API_KEY')) {
                    apiKeyValid = false;
                }
            }
        } catch (error) {
            toasts.error('Error processing prompt. Please check your API key.');
            console.error('Prompt processing error:', error);
        } finally {
            isProcessing = false;
        }
    }
    
    function validateApiKey() {
        // Basic validation - check if it looks like a Google API key
        const trimmedKey = apiKey.trim();
        apiKeyValid = trimmedKey.length > 20 && (trimmedKey.startsWith('AIza') || trimmedKey.includes('-'));
    }
    
    async function copyPrompt() {
        const promptToCopy = processedPrompt || prompt;
        const promptType = processedPrompt ? 'processed' : 'original';
        
        try {
            await navigator.clipboard.writeText(promptToCopy);
            toasts.success(`✅ ${processedPrompt ? 'Smart processed' : 'AI image'} prompt copied! Paste it into ChatGPT, DALL-E, or your favorite AI image generator`);
        } catch (err) {
            // Fallback for browsers without clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = promptToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            toasts.success(`✅ ${processedPrompt ? 'Smart processed' : 'AI image'} prompt copied! Paste it into ChatGPT, DALL-E, or your favorite AI image generator`);
        }
    }
    
    function regeneratePrompt() {
        generatePrompt();
    }
</script>

<div class="ai-image-dialog">
    <div class="dialog-header">
        <h2>🤖 AI Image Generator</h2>
        <button class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        <div class="card-info">
            <h3>Generating image prompt for:</h3>
            <div class="card-preview">
                <strong>{card.title}</strong>
                {#if card.subtitle}
                    <span class="role">- {card.subtitle}</span>
                {/if}
                <div class="theme-info">Theme: <span class="theme">{deckTheme}</span></div>
            </div>
        </div>
        
        <!-- API Key Section -->
        <div class="api-key-section">
            <div class="section-header">
                <h3>🚀 Optional: Smart Content Filter Bypass</h3>
                <button 
                    class="toggle-button"
                    onclick={() => showApiKeySection = !showApiKeySection}
                >
                    {showApiKeySection ? 'Hide' : 'Show'} Smart Processing
                </button>
            </div>
            
            {#if showApiKeySection}
                <div class="api-key-content">
                    <p class="api-key-description">
                        Use <strong>your own</strong> Google AI Studio API key to automatically process prompts 
                        and avoid content filtering issues. Your API key stays in your browser - we never see it!
                    </p>
                    
                    <div class="api-key-input-group">
                        <input 
                            type="password"
                            bind:value={apiKey}
                            oninput={validateApiKey}
                            placeholder="Paste your Google AI Studio API key here"
                            class="api-key-input"
                            class:valid={apiKeyValid}
                        />
                        <a 
                            href="https://aistudio.google.com/apikey" 
                            target="_blank" 
                            class="get-key-link"
                        >
                            Get API Key →
                        </a>
                    </div>
                    
                    <div class="security-note">
                        🔒 <strong>Your privacy:</strong> API key is stored only in your browser. 
                        All requests go directly to Google - never through our servers.
                    </div>
                </div>
            {/if}
        </div>
        
        <div class="prompt-section">
            <div class="prompt-header">
                <h3>🎯 Ready to copy:</h3>
                <div class="prompt-header-actions">
                    {#if apiKeyValid && prompt && !processedPrompt}
                        <button 
                            class="process-button"
                            onclick={processPromptWithGemini}
                            disabled={isProcessing}
                        >
                            {isProcessing ? '🤖 Processing...' : '🤖 Smart Process'}
                        </button>
                    {/if}
                    <button 
                        class="regenerate-button"
                        onclick={regeneratePrompt}
                        disabled={isGenerating}
                    >
                        🔄 {isGenerating ? 'Generating...' : 'Regenerate'}
                    </button>
                </div>
            </div>
            
            <div class="prompt-display">
                {#if isGenerating}
                    <div class="generating">
                        <div class="spinner"></div>
                        <p>Analyzing card content...</p>
                    </div>
                {:else if isProcessing}
                    <div class="generating">
                        <div class="spinner"></div>
                        <p>Processing prompt with Gemini AI...</p>
                    </div>
                {:else}
                    <pre class="prompt-text">{processedPrompt || prompt}</pre>
                {/if}
            </div>
            
            {#if processedPrompt}
                <div class="processed-notice">
                    ✨ <strong>Smart processed!</strong> This version is optimized to avoid content filters.
                    <button 
                        class="show-original-button"
                        onclick={() => processedPrompt = ''}
                    >
                        Show Original
                    </button>
                </div>
            {/if}
            
            <div class="prompt-actions">
                <button 
                    class="copy-button primary"
                    onclick={copyPrompt}
                    disabled={isGenerating || !prompt}
                >
                    📋 Copy {processedPrompt ? 'Processed ' : ''}Prompt
                </button>
            </div>
        </div>
        
        <div class="instructions">
            <h4>📝 How to use:</h4>
            <ol>
                <li>Copy the prompt above</li>
                <li>Go to ChatGPT, DALL-E, Midjourney, or your preferred AI image generator</li>
                <li>Paste the prompt and generate your image</li>
                <li>Download the image and add it to your card</li>
            </ol>
            
            <div class="tips">
                <h4>💡 Pro Tips:</h4>
                <ul>
                    <li>Try adding style keywords like "digital art", "oil painting", or "photorealistic"</li>
                    <li>For consistent character appearance, mention specific details like hair color, clothing, etc.</li>
                    <li>The 5:7 aspect ratio is perfect for card portraits</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<style>
    .ai-image-dialog {
        background: white;
        border-radius: 8px;
        max-width: 600px;
        width: 95vw;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
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
    
    .card-info h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 600;
    }
    
    .card-preview {
        background: var(--ui-hover-bg, #f8fafc);
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .card-preview strong {
        font-size: 1.1rem;
    }
    
    .role {
        color: var(--ui-muted, #64748b);
        font-style: italic;
    }
    
    .theme-info {
        margin-top: 0.5rem;
        font-size: 0.9rem;
        color: var(--ui-muted, #64748b);
    }
    
    .theme {
        color: var(--ui-success, #059669);
        font-weight: 500;
    }
    
    .prompt-section h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--ui-success, #059669);
    }
    
    .prompt-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .regenerate-button {
        padding: 0.5rem 1rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .regenerate-button:hover:not(:disabled) {
        background: var(--ui-hover-bg, #f8fafc);
        border-color: var(--ui-success, #059669);
    }
    
    .regenerate-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .prompt-display {
        background: var(--ui-hover-bg, #f8fafc);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        min-height: 120px;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .generating {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        color: var(--ui-muted, #64748b);
    }
    
    .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--ui-border, #e2e8f0);
        border-top: 2px solid var(--ui-success, #059669);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .prompt-text {
        padding: 1rem;
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.4;
        white-space: pre-wrap;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        color: var(--ui-text, #1a202c);
    }
    
    .prompt-actions {
        display: flex;
        justify-content: center;
    }
    
    .copy-button {
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--ui-success, #059669);
        color: white;
    }
    
    .copy-button:hover:not(:disabled) {
        background: #047857;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .copy-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }
    
    .instructions {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 6px;
        padding: 1rem;
    }
    
    .instructions h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--ui-primary, #3b82f6);
    }
    
    .instructions ol,
    .instructions ul {
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.875rem;
        line-height: 1.5;
    }
    
    .instructions li {
        margin-bottom: 0.25rem;
    }
    
    .tips {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(59, 130, 246, 0.2);
    }
    
    /* API Key Section Styles */
    .api-key-section {
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
        border: 1px solid rgba(168, 85, 247, 0.2);
        border-radius: 6px;
        overflow: hidden;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid rgba(168, 85, 247, 0.2);
    }
    
    .section-header h3 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--ui-purple, #7c3aed);
    }
    
    .toggle-button {
        padding: 0.375rem 0.75rem;
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 4px;
        background: rgba(168, 85, 247, 0.1);
        color: var(--ui-purple, #7c3aed);
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .toggle-button:hover {
        background: rgba(168, 85, 247, 0.2);
        border-color: rgba(168, 85, 247, 0.4);
    }
    
    .api-key-content {
        padding: 1rem;
    }
    
    .api-key-description {
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--ui-text, #1a202c);
    }
    
    .api-key-input-group {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
        align-items: center;
    }
    
    .api-key-input {
        flex: 1;
        padding: 0.75rem;
        border: 2px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        font-size: 0.875rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        transition: border-color 0.2s;
    }
    
    .api-key-input:focus {
        outline: none;
        border-color: var(--ui-purple, #7c3aed);
    }
    
    .api-key-input.valid {
        border-color: var(--ui-success, #059669);
        background-color: rgba(34, 197, 94, 0.05);
    }
    
    .get-key-link {
        padding: 0.75rem 1rem;
        background: var(--ui-purple, #7c3aed);
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
        white-space: nowrap;
    }
    
    .get-key-link:hover {
        background: #6d28d9;
        transform: translateY(-1px);
    }
    
    .security-note {
        font-size: 0.75rem;
        color: var(--ui-muted, #64748b);
        background: rgba(168, 85, 247, 0.05);
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid rgba(168, 85, 247, 0.15);
    }
    
    /* Enhanced prompt header */
    .prompt-header-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .process-button {
        padding: 0.5rem 1rem;
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 6px;
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        color: var(--ui-purple, #7c3aed);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }
    
    .process-button:hover:not(:disabled) {
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
        border-color: rgba(168, 85, 247, 0.5);
        transform: translateY(-1px);
    }
    
    .process-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
    
    .processed-notice {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
        border: 1px solid rgba(34, 197, 94, 0.2);
        border-radius: 6px;
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
        color: var(--ui-success, #059669);
    }
    
    .show-original-button {
        padding: 0.25rem 0.5rem;
        border: 1px solid rgba(34, 197, 94, 0.3);
        border-radius: 4px;
        background: rgba(34, 197, 94, 0.1);
        color: var(--ui-success, #059669);
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .show-original-button:hover {
        background: rgba(34, 197, 94, 0.2);
        border-color: rgba(34, 197, 94, 0.4);
    }
    
    @media (max-width: 640px) {
        .prompt-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
        }
        
        .prompt-header-actions {
            width: 100%;
            justify-content: flex-start;
        }
        
        .prompt-actions {
            margin-top: 1rem;
        }
        
        .api-key-input-group {
            flex-direction: column;
            align-items: stretch;
        }
        
        .get-key-link {
            text-align: center;
        }
        
        .processed-notice {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
        }
    }
</style>
