<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import { generateAiPrompt, copyAiPromptToClipboard } from '$lib/next/utils/jsonExporter.js';
    import { toasts } from '$lib/stores/toast.js';
    import { browser } from '$app/environment';
    
    // Local state
    let theme = $state('');
    let cardCount = $state(8);
    let prompt = $state('');
    let processedPrompt = $state('');
    let isGenerating = $state(false);
    let isProcessing = $state(false);
    let showPrompt = $state(false);
    let apiKey = $state('');
    let showApiKeySection = $state(false);
    let apiKeyValid = $state(false);
    
    // Example themes for inspiration
    const exampleThemes = [
        'Hamlet Characters',
        'Greek Mythology Heroes',
        'Star Wars Original Trilogy',
        'Lord of the Rings Fellowship',
        'Marvel Superheroes',
        'DC Comics Villains',
        'Studio Ghibli Characters',
        'Classic Horror Monsters',
        'Sherlock Holmes Stories',
        'Pirates of the Caribbean'
    ];
    
    function generatePrompt() {
        if (!theme.trim()) {
            toasts.error('Please enter a theme for your deck');
            return;
        }
        
        isGenerating = true;
        
        // Small delay for UX
        setTimeout(() => {
            prompt = generateAiPrompt(theme.trim(), cardCount);
            showPrompt = true;
            isGenerating = false;
        }, 300);
    }
    
    async function copyPrompt() {
        try {
            const success = await copyAiPromptToClipboard(theme.trim(), cardCount);
            if (success) {
                toasts.success('✅ Prompt copied! Paste it into ChatGPT, Claude, or your favorite AI');
            } else {
                // Fallback for browsers without clipboard API
                await navigator.clipboard.writeText(prompt);
                toasts.success('✅ Prompt copied! Paste it into ChatGPT, Claude, or your favorite AI');
            }
        } catch (err) {
            // Manual copy fallback
            const textArea = document.createElement('textarea');
            textArea.value = prompt;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            toasts.success('✅ Prompt copied! Paste it into ChatGPT, Claude, or your favorite AI');
        }
    }
    
    function useExampleTheme(exampleTheme: string) {
        theme = exampleTheme;
        showPrompt = false; // Reset to allow regeneration
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
                toasts.success('🎯 Prompt processed successfully! This version should work better with AI services.');
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
    
    // Generate a deck via Gemini and auto-import it
    async function generateDeckWithGemini() {
        if (!browser) {
            toasts.error('This feature is only available in the browser');
            return;
        }
        if (!apiKey.trim()) {
            toasts.error('Please enter your Google AI Studio API key first');
            return;
        }
        if (!theme.trim()) {
            toasts.error('Please enter a theme/topic first');
            return;
        }

        isProcessing = true;
        try {
            const { generateDeckFromPrompt } = await import('$lib/ai/index.js');
            const topic = `${theme.trim()}`; // keep it concise to avoid meta-instructions
            const result = await generateDeckFromPrompt(apiKey, topic, cardCount);

            if (!result.success || !result.deck) {
                toasts.error(`Deck generation failed: ${result.error || 'Unknown error'}`);
                return;
            }

            // Validate and import via importer for consistency
            const { importDeckFromJson } = await import('$lib/next/utils/jsonImporter.js');
            const importResult = await importDeckFromJson(JSON.stringify(result.deck));
            if (!importResult.success || !importResult.deck) {
                toasts.error(`Generated JSON didn't validate: ${importResult.error || 'Unknown error'}`);
                return;
            }

            const { nextDeckStore } = await import('$lib/next/stores/deckStore.svelte.js');
            const { nextDb } = await import('$lib/next/stores/database.js');
            await nextDb.saveDeck(importResult.deck);
            await nextDeckStore.selectDeck(importResult.deck.id);

            toasts.success(`✅ Generated and imported deck: "${importResult.deck.meta.title}"`);
            dialogStore.close();
        } catch (error) {
            console.error('Deck generation error:', error);
            toasts.error('Error generating deck. Please check your API key.');
        } finally {
            isProcessing = false;
        }
    }
    
    function validateApiKey() {
        // Basic validation - check if it looks like a Google API key
        const trimmedKey = apiKey.trim();
        apiKeyValid = trimmedKey.length > 20 && (trimmedKey.startsWith('AIza') || trimmedKey.includes('-'));
    }
    
    function handleApiKeyInput(e: InputEvent) {
        validateApiKey();
        e.stopPropagation();
    }
    
    function handleApiKeyKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
    
    function reset() {
        theme = '';
        cardCount = 8;
        prompt = '';
        processedPrompt = '';
        showPrompt = false;
        showApiKeySection = false;
    }
</script>

<div class="ai-prompt-dialog">
    <div class="dialog-header">
        <h2>🤖 AI Deck Generator</h2>
        <button class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        {#if !showPrompt}
            <!-- Configuration Phase -->
            <div class="config-section">
                <h3>Create a Custom Character Deck</h3>
                <p class="description">
                    Generate a prompt to create character decks with AI tools like ChatGPT, Claude, or others.
                    The AI will create a complete deck with detailed characters, traits, and stats.
                </p>
                
                <div class="form-group">
                    <label for="theme-input">Theme or Topic:</label>
                    <input 
                        id="theme-input"
                        type="text" 
                        bind:value={theme}
                        placeholder="e.g., Hamlet Characters, Greek Mythology, Star Wars..."
                        class="theme-input"
                    />
                </div>
                
                <div class="form-group">
                    <label for="count-input">Number of Characters:</label>
                    <input 
                        id="count-input"
                        type="number" 
                        bind:value={cardCount}
                        min="3"
                        max="20"
                        class="count-input"
                    />
                    <span class="input-hint">3-20 cards recommended</span>
                </div>
                
                <div class="examples-section">
                    <h4>💡 Example Themes:</h4>
                    <div class="example-grid">
                        {#each exampleThemes as exampleTheme}
                            <button 
                                class="example-button"
                                onclick={() => useExampleTheme(exampleTheme)}
                            >
                                {exampleTheme}
                            </button>
                        {/each}
                    </div>
                </div>
                
                <div class="generate-section">
                    <button 
                        class="generate-button primary"
                        onclick={generatePrompt}
                        disabled={!theme.trim() || isGenerating}
                    >
                        {isGenerating ? 'Generating...' : 'Generate AI Prompt'}
                    </button>
                </div>
            </div>
        {:else}
            <!-- Prompt Display Phase -->
            <div class="prompt-section">
                <h3>🎯 Your AI Prompt is Ready!</h3>
                <p class="instructions">
                    Copy this prompt and paste it into ChatGPT, Claude, or your favorite AI assistant:
                </p>
                
                <!-- Smart Processing Section -->
                <div class="api-key-section">
                    <div class="section-header">
                        <h4>🤖 Optional: Use Your Own Gemini API</h4>
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
                                Instead of copying the prompt manually, use <strong>your own</strong> Google AI Studio API key 
                                to run the prompt directly through Gemini and get instant results!
                            </p>
                            
                            <div class="api-key-input-group">
                                <input 
                                    type="password"
                                    bind:value={apiKey}
                                    oninput={handleApiKeyInput}
                                    onkeydown={handleApiKeyKeydown}
                                    onclick={(e) => e.stopPropagation()}
                                    onmousedown={(e) => e.stopPropagation()}
                                    onmouseup={(e) => e.stopPropagation()}
                                    onfocus={(e) => e.stopPropagation()}
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
                            
{#if apiKeyValid}
                                <div class="smart-actions">
                                    <button 
                                        class="process-button"
                                        onclick={generateDeckWithGemini}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? '🚀 Generating Deck…' : '🚀 Generate Deck Now'}
                                    </button>
                                </div>
                            {/if}
                            
                            <div class="security-note">
                                🔒 <strong>Your privacy:</strong> API key stays in your browser. 
                                All requests go directly to Google - we never see your key.
                            </div>
                        </div>
                    {/if}
                </div>
                
                <div class="prompt-display">
                    {#if isProcessing}
                        <div class="processing-state">
                            <div class="spinner"></div>
                            <p>Generating your deck with Gemini AI...</p>
                        </div>
                    {:else if processedPrompt}
                        <div class="result-header">
                            <h4>✨ Gemini Generated Result:</h4>
                            <button 
                                class="show-original-button"
                                onclick={() => processedPrompt = ''}
                            >
                                Show Original Prompt
                            </button>
                        </div>
                        <pre class="prompt-text">{processedPrompt}</pre>
                    {:else}
                        <pre class="prompt-text">{prompt}</pre>
                    {/if}
                </div>
                
                <div class="prompt-actions">
                    <button 
                        class="copy-button primary"
                        onclick={copyPrompt}
                    >
                        📋 Copy {processedPrompt ? 'Result' : 'Prompt'}
                    </button>
                    <button 
                        class="back-button"
                        onclick={() => showPrompt = false}
                    >
                        ← Edit Settings
                    </button>
                </div>
                
                <div class="next-steps">
                    <h4>📝 Next Steps:</h4>
                    <ol>
                        <li>Copy the prompt above</li>
                        <li>Paste it into ChatGPT, Claude, or similar AI tool</li>
                        <li>Wait for the AI to generate your deck JSON</li>
                        <li>Copy the generated JSON</li>
                        <li>Use "Import JSON" to add it to your collection</li>
                    </ol>
                </div>
                
                <div class="tips-section">
                    <h4>💡 Pro Tips:</h4>
                    <ul>
                        <li>Ask the AI to "include image URLs from Wikipedia or public sources"</li>
                        <li>Request "detailed character descriptions with personality traits"</li>
                        <li>If the response is cut off, ask "please continue" or "show the rest"</li>
                        <li>For Hamlet specifically: "Include portraits from classical paintings or productions"</li>
                    </ul>
                </div>
            </div>
        {/if}
    </div>
    
    <div class="dialog-footer">
        <button 
            class="footer-button secondary"
            onclick={reset}
        >
            🔄 Start Over
        </button>
        <button 
            class="footer-button secondary"
            onclick={() => dialogStore.close()}
        >
            Close
        </button>
    </div>
</div>

<style>
    .ai-prompt-dialog {
        background: white;
        border-radius: 8px;
        max-width: 700px;
        width: 95vw;
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
    }
    
    .config-section h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .description {
        color: var(--ui-muted, #64748b);
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--ui-text, #1a202c);
    }
    
    .theme-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 1rem;
    }
    
    .theme-input:focus {
        outline: none;
        border-color: var(--button-primary-bg, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .count-input {
        width: 100px;
        padding: 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 1rem;
        margin-right: 0.75rem;
    }
    
    .count-input:focus {
        outline: none;
        border-color: var(--button-primary-bg, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .input-hint {
        color: var(--ui-muted, #64748b);
        font-size: 0.875rem;
    }
    
    .examples-section {
        margin-bottom: 2rem;
    }
    
    .examples-section h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 500;
    }
    
    .example-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.5rem;
    }
    
    .example-button {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }
    
    .example-button:hover {
        background: var(--ui-hover-bg, #f8fafc);
        border-color: var(--button-primary-bg, #3b82f6);
    }
    
    .generate-section {
        text-align: center;
    }
    
    .generate-button {
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .generate-button.primary {
        background: var(--button-primary-bg, #3b82f6);
        color: white;
    }
    
    .generate-button.primary:hover:not(:disabled) {
        background: var(--button-primary-hover-bg, #2563eb);
    }
    
    .generate-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .prompt-section h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--ui-success, #059669);
    }
    
    .instructions {
        color: var(--ui-muted, #64748b);
        margin-bottom: 1rem;
        line-height: 1.5;
    }
    
    .prompt-display {
        background: var(--ui-hover-bg, #f8fafc);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        margin-bottom: 1rem;
        max-height: 300px;
        overflow-y: auto;
    }
    
    .prompt-text {
        padding: 1rem;
        margin: 0;
        font-size: 0.75rem;
        line-height: 1.4;
        white-space: pre-wrap;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
    
    .prompt-actions {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        justify-content: center;
    }
    
    .copy-button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--ui-success, #059669);
        color: white;
    }
    
    .copy-button:hover {
        background: #047857;
    }
    
    .back-button {
        padding: 0.75rem 1rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        background: var(--ui-bg, #ffffff);
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .back-button:hover {
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .next-steps,
    .tips-section {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .next-steps h4,
    .tips-section h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--button-primary-bg, #3b82f6);
    }
    
    .next-steps ol,
    .tips-section ul {
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.875rem;
        line-height: 1.5;
    }
    
    .next-steps li,
    .tips-section li {
        margin-bottom: 0.25rem;
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
    
    /* API Key Section Styles */
    .api-key-section {
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
        border: 1px solid rgba(168, 85, 247, 0.2);
        border-radius: 6px;
        margin-bottom: 1.5rem;
        overflow: hidden;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(168, 85, 247, 0.2);
    }
    
    .section-header h4 {
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
        margin-bottom: 1rem;
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
    
    .smart-actions {
        margin-bottom: 0.75rem;
        text-align: center;
    }
    
    .process-button {
        padding: 0.75rem 1.5rem;
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 6px;
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        color: var(--ui-purple, #7c3aed);
        font-size: 1rem;
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
    
    .security-note {
        font-size: 0.75rem;
        color: var(--ui-muted, #64748b);
        background: rgba(168, 85, 247, 0.05);
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid rgba(168, 85, 247, 0.15);
    }
    
    .processing-state {
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
        border-top: 2px solid var(--ui-purple, #7c3aed);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
        border-bottom: 1px solid rgba(34, 197, 94, 0.2);
        margin: 0;
    }
    
    .result-header h4 {
        margin: 0;
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
    
    @media (max-width: 768px) {
        .example-grid {
            grid-template-columns: 1fr;
        }
        
        .prompt-actions {
            flex-direction: column;
        }
        
        .dialog-footer {
            flex-direction: column;
        }
        
        .api-key-input-group {
            flex-direction: column;
            align-items: stretch;
        }
        
        .get-key-link {
            text-align: center;
        }
        
        .result-header {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
        }
    }
</style>
