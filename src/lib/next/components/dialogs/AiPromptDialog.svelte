<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import { toasts } from '$lib/stores/toast.js';
    import { browser } from '$app/environment';
    import ApiKeyInput from '../ui/ApiKeyInput.svelte';
    
    // Local state
    let theme = $state('');
    let cardCount = $state(8);
    let isGenerating = $state(false);
    let showApiKeyRow = $state(false);
    let apiKey = $state('');
    let showGeneratingOverlay = $state(false);
    
    // Quirky random prompt components
    const subjects = [
        'Dinner recipes', 'Campfire stories', 'List of recommended movies', 'Household cleaning products', 
        'Office supplies', 'Exotic vacation destinations', 'Breakfast cereals', 'Medieval torture devices',
        'Self-help books', 'Smartphone apps', 'Board game pieces', 'Yoga poses', 'Weather phenomena',
        'Pizza toppings', 'Extinct animals', 'Space missions', 'Dance moves', 'Kitchen appliances'
    ];
    
    const basedOn = [
        'Disney Princesses', 'Steampunk gadgets', 'Wildlife documentaries', 'Norse mythology', 
        'Failed startup ideas', 'Retro video games', 'Conspiracy theories', 'Ancient philosophers',
        'Social media influencers', 'Zombie apocalypse survivors', 'Victorian inventors', 'Alien species',
        'Fairy tale villains', 'Time travel paradoxes', 'Underground rock bands', 'Haunted antiques'
    ];
    
    const characteristics = [
        'traits and stats suitable for IKEA furniture', 'odd references to tropical birds',
        'extensive rhyming in all text content', 'mysterious connections to cheese varieties',
        'stats based on likelihood to survive a zombie apocalypse', 'descriptions written like Shakespearean sonnets',
        'traits that would make them excellent dance partners', 'stats measuring their compatibility with houseplants',
        'abilities related to competitive sandwich making', 'mysterious powers involving forgotten board games',
        'stats for navigating corporate office politics', 'traits based on their favorite extinct animals',
        'powers related to predicting weather using only socks', 'abilities involving interpretive dance battles'
    ];
    
    function generateRandomPrompt() {
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const basedOnItem = basedOn[Math.floor(Math.random() * basedOn.length)];
        const characteristic = characteristics[Math.floor(Math.random() * characteristics.length)];
        
        return `${subject} based on ${basedOnItem}, with ${characteristic}`;
    }
    
    function proceedToApiKey() {
        if (!theme.trim()) {
            toasts.error('Please enter a theme for your deck');
            return;
        }
        
        // Show API key input row
        showApiKeyRow = true;
    }
    
    // This function is no longer used in the simplified flow
    
    function insertRandomPrompt() {
        theme = generateRandomPrompt();
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

        isGenerating = true;
        showGeneratingOverlay = true;
        
        try {
            const { generateDeckFromPrompt } = await import('$lib/ai/index.js');
            const topic = `${theme.trim()}`; // keep it concise to avoid meta-instructions
            const result = await generateDeckFromPrompt(apiKey, topic, cardCount);

            if (!result.success || !result.deck) {
                toasts.error(`Deck generation failed: ${result.error || 'Unknown error'}`);
                showGeneratingOverlay = false;
                return;
            }

            // Validate and import via importer for consistency
            const { importDeckFromJson } = await import('$lib/next/utils/jsonImporter.js');
            const importResult = await importDeckFromJson(JSON.stringify(result.deck));
            if (!importResult.success || !importResult.deck) {
                toasts.error(`Generated JSON didn't validate: ${importResult.error || 'Unknown error'}`);
                showGeneratingOverlay = false;
                return;
            }

            const { nextDeckStore } = await import('$lib/next/stores/deckStore.svelte.js');
            const { nextDb } = await import('$lib/next/stores/database.js');
            await nextDb.upsertDeck(importResult.deck);
            await nextDeckStore.selectDeck(importResult.deck.id);

            toasts.success(`✅ Generated and imported deck: "${importResult.deck.meta.title}"`);
            dialogStore.close();
        } catch (error) {
            console.error('Deck generation error:', error);
            toasts.error('Error generating deck. Please check your API key.');
            showGeneratingOverlay = false;
        } finally {
            isGenerating = false;
        }
    }
    
    
    
    function reset() {
        theme = '';
        cardCount = 8;
        isGenerating = false;
        showApiKeyRow = false;
        apiKey = '';
        showGeneratingOverlay = false;
    }
</script>

<div class="ai-prompt-dialog">
    <div class="dialog-header">
        <h2>🤖 AI Deck Generator</h2>
        <button type="button" class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        <!-- Main configuration section -->
        <div class="config-section">
            <h3>Create a full deck with AI</h3>
            <p class="description">
                Describe the deck you want and the AI will create a complete deck with detailed cards, traits, and stats.
            </p>
            
            <!-- First row - always visible -->
            <div class="compact-form" class:disabled={showApiKeyRow}>
                <textarea 
                    bind:value={theme}
                    placeholder="Describe the deck you want - be creative! The AI can handle it!"
                    class="theme-textarea"
                    rows="2"
                    disabled={showApiKeyRow}
                ></textarea>
                
                <button 
                    type="button"
                    class="random-button"
                    onclick={insertRandomPrompt}
                    title="Generate a fun random prompt to show the AI's versatility"
                    disabled={showApiKeyRow}
                >
                    🎲 Random!
                </button>
                
                <div class="count-wrapper">
                    <label for="count-input" class="count-label">at least</label>
                    <input 
                        id="count-input"
                        type="number" 
                        bind:value={cardCount}
                        min="3"
                        max="20"
                        class="count-input-compact"
                        disabled={showApiKeyRow}
                    />
                    <span class="count-label-below">cards</span>
                </div>
                
                <button 
                    type="button"
                    class="generate-button-compact primary"
                    onclick={proceedToApiKey}
                    disabled={!theme.trim() || showApiKeyRow}
                >
                    {showApiKeyRow ? '✅ OK' : '🚀 GO!'}
                </button>
            </div>
            
            <div class="example-hint">
                💡 Try clicking "Random!" to see how versatile the AI can be with quirky prompts!
            </div>
            
            <!-- Second row - API key input (revealed after first Generate! click) -->
            {#if showApiKeyRow}
                <div style="margin-bottom: 1rem;">
                    <ApiKeyInput 
                        {apiKey}
                        onApiKeyChange={(key:string) => apiKey = key}
                        onSubmit={generateDeckWithGemini}
                        isProcessing={isGenerating}
                        submitButtonText="🚀 Generate Deck"
                        processingButtonText="🚀 Generating…"
                        placeholder="Paste your Google AI Studio API key here"
                    />
                </div>
                
                <div class="api-key-info">
                    <p class="security-note-simple">
                        🔒 According to Google's ToS, you shouldnt share API keys, and that is sensible so we <em>promise</em> we won't copy yours! 
                        We will send the request directly to Google AI Studio. We're working on a paid feature so you won't need 
                        to enter your key like this - check back later some time if you don't trust us (we're astoundingly trustworthy, but we get it). 
                        <a href="https://aistudio.google.com/apikey" target="_blank" class="inline-link">Get your Google API key →</a>
                    </p>
                </div>
            {/if}
        </div>
        
        <!-- Generating overlay -->
        {#if showGeneratingOverlay}
            <div class="generating-overlay">
                <button 
                    type="button" 
                    class="overlay-close-button" 
                    onclick={() => dialogStore.close()}
                    title="Close dialog (generation continues in background)"
                >
                    ×
                </button>
                <div class="overlay-content">
                    <div class="spinner-large"></div>
                    <h3>Your deck with the prompt "{theme}" is being generated</h3>
                    <p>
                        You can now 
                        <button 
                            type="button" 
                            class="close-text-button"
                            onclick={() => dialogStore.close()}
                        >
                            close this dialog
                        </button>
                        and continue using the app.
                    </p>
                </div>
            </div>
        {/if}
    </div>
    
    <div class="dialog-footer">
        <button 
            type="button"
            class="footer-button secondary"
            onclick={reset}
        >
            🔄 Start Over
        </button>
        <button 
            type="button"
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
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Compact Form Styles */
    .compact-form {
        display: flex;
        gap: 0.75rem;
        align-items: stretch;
        margin-bottom: 1rem;
    }
    
    .theme-textarea {
        flex: 1;
        padding: 2px 4px;
        border: 2px solid var(--ui-border, #e2e8f0);
        border-radius: 6px;
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
        min-height: 64px;
        transition: border-color 0.2s;
        height: fit-content;
    }
    
    .theme-textarea:focus {
        outline: none;
        border-color: var(--button-primary-bg, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .random-button {
        padding: 0.75rem 1rem;
        border: 2px solid rgba(251, 191, 36, 0.3);
        border-radius: 6px;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
        color: #d97706;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        min-height: 60px;
        display: flex;
        align-items: center;
    }
    
    .random-button:hover {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%);
        border-color: rgba(251, 191, 36, 0.5);
        transform: translateY(-1px);
    }
    
    .count-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        min-width: 80px;
    }
    
    .count-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--ui-muted, #64748b);
        margin: 0;
        text-align: center;
    }
    
    .count-label-below {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--ui-muted, #64748b);
        margin: 0;
        text-align: center;
    }
    
    .count-input-compact {
        width: 60px;
        padding: 0.5rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 0.875rem;
        text-align: center;
        margin: 0;
    }
    
    .count-input-compact:focus {
        outline: none;
        border-color: var(--button-primary-bg, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    
    .generate-button-compact {
        padding: 0.75rem 1.25rem;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        min-height: 60px;
        display: flex;
        align-items: center;
        background: var(--button-primary-bg, #3b82f6);
        color: white;
    }
    
    .generate-button-compact:hover:not(:disabled) {
        background: var(--button-primary-hover-bg, #2563eb);
        transform: translateY(-1px);
    }
    
    .generate-button-compact:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }
    
    .example-hint {
        text-align: center;
        color: var(--ui-muted, #64748b);
        font-size: 0.875rem;
        font-style: italic;
    }
    
    /* Disabled state for compact form */
    .compact-form.disabled {
        opacity: 0.6;
    }
    
    .compact-form.disabled .theme-textarea,
    .compact-form.disabled .random-button,
    .compact-form.disabled .count-input-compact {
        cursor: not-allowed;
    }
    
    
    
    .api-key-info {
        margin-top: 0.75rem;
    }
    
    .security-note-simple {
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
    
    /* Generating Overlay Styles */
    .generating-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    }
    
    .overlay-close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.2rem;
        color: var(--ui-muted, #64748b);
        transition: all 0.2s;
    }
    
    .overlay-close-button:hover {
        background: white;
        color: var(--ui-text, #1a202c);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .overlay-content {
        text-align: center;
        padding: 2rem;
    }
    
    .overlay-content h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--ui-text, #1a202c);
    }
    
    .overlay-content p {
        margin: 0;
        color: var(--ui-muted, #64748b);
        font-size: 0.875rem;
    }
    
    .close-text-button {
        background: none;
        border: none;
        color: var(--button-primary-bg, #3b82f6);
        text-decoration: underline;
        font-size: inherit;
        font-weight: 500;
        cursor: pointer;
        padding: 0;
        margin: 0;
        transition: color 0.2s;
    }
    
    .close-text-button:hover {
        color: var(--button-primary-hover-bg, #2563eb);
    }
    
    .spinner-large {
        width: 48px;
        height: 48px;
        border: 4px solid var(--ui-border, #e2e8f0);
        border-top: 4px solid var(--button-primary-bg, #3b82f6);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1.5rem auto;
    }
    
    @media (max-width: 768px) {
        
        /* Mobile responsive for compact form */
        .compact-form {
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .theme-textarea {
            min-height: 80px;
        }
        
        .count-wrapper {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        
        .count-input-compact {
            width: 80px;
        }
        
    }
</style>
