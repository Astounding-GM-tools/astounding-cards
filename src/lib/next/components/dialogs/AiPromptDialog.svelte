<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import { generateAiPrompt, copyAiPromptToClipboard } from '$lib/next/utils/jsonExporter.js';
    import { toasts } from '$lib/stores/toast.js';
    
    // Local state
    let theme = $state('');
    let cardCount = $state(8);
    let prompt = $state('');
    let isGenerating = $state(false);
    let showPrompt = $state(false);
    
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
    
    function reset() {
        theme = '';
        cardCount = 8;
        prompt = '';
        showPrompt = false;
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
                
                <div class="prompt-display">
                    <pre class="prompt-text">{prompt}</pre>
                </div>
                
                <div class="prompt-actions">
                    <button 
                        class="copy-button primary"
                        onclick={copyPrompt}
                    >
                        📋 Copy Prompt
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
    }
</style>
