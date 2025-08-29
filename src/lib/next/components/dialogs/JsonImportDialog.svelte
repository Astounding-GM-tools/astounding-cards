<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import type { Deck } from '$lib/next/types/deck.js';
    
    // Local state
    let isImporting = $state(false);
    let error = $state<string | null>(null);
    let importedDeck = $state<Deck | null>(null);
    let importMethod = $state<'file' | 'text'>('file');
    let jsonText = $state('');
    let fileInput = $state<HTMLInputElement>();
    let needsMerge = $state(false);
    
    async function handleFileImport(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;
        
        isImporting = true;
        error = null;
        
        try {
            const text = await file.text();
            await parseJsonContent(text);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to read file';
        } finally {
            isImporting = false;
        }
    }
    
    async function handleTextImport() {
        if (!jsonText.trim()) {
            error = 'Please enter JSON content';
            return;
        }
        
        isImporting = true;
        error = null;
        
        try {
            await parseJsonContent(jsonText);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to parse JSON';
        } finally {
            isImporting = false;
        }
    }
    
    async function parseJsonContent(jsonContent: string) {
        try {
            const parsed = JSON.parse(jsonContent);
            
            // TODO: Implement proper JSON validation
            // Validate structure, version compatibility, etc.
            if (!parsed.deck) {
                throw new Error('Invalid deck format: missing deck data');
            }
            
            importedDeck = parsed.deck;
            
            // TODO: Check if deck ID already exists
            // If it does, set needsMerge = true
            needsMerge = false; // For now, assume no conflicts
            
        } catch (err) {
            if (err instanceof SyntaxError) {
                throw new Error('Invalid JSON format');
            }
            throw err;
        }
    }
    
    function proceedWithImport() {
        if (!importedDeck) return;
        
        if (needsMerge) {
            // TODO: Open MergeToolDialog
            console.log('Opening merge tool...');
        } else {
            // TODO: Import deck directly
            console.log('Importing deck directly...');
            // dialogStore.close();
        }
    }
    
    function clearImport() {
        importedDeck = null;
        jsonText = '';
        error = null;
        needsMerge = false;
        if (fileInput) {
            fileInput.value = '';
        }
    }
</script>

<div class="json-import-dialog">
    <div class="dialog-header">
        <h2>📥 Import JSON</h2>
        <button class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        {#if !importedDeck}
            <div class="import-methods">
                <h3>Import Method</h3>
                <div class="method-tabs">
                    <button 
                        class="method-tab" 
                        class:active={importMethod === 'file'}
                        onclick={() => importMethod = 'file'}
                    >
                        📁 From File
                    </button>
                    <button 
                        class="method-tab" 
                        class:active={importMethod === 'text'}
                        onclick={() => importMethod = 'text'}
                    >
                        📝 From Text
                    </button>
                </div>
            </div>
            
            {#if importMethod === 'file'}
                <div class="file-import">
                    <div class="file-drop-zone">
                        <input 
                            bind:this={fileInput}
                            type="file" 
                            accept=".json,application/json"
                            onchange={handleFileImport}
                            class="file-input"
                            id="json-file-input"
                        />
                        <label for="json-file-input" class="file-drop-label">
                            <div class="file-drop-content">
                                <div class="file-drop-icon">📄</div>
                                <p>Click to select JSON file</p>
                                <p class="file-drop-hint">or drag and drop here</p>
                            </div>
                        </label>
                    </div>
                </div>
            {:else}
                <div class="text-import">
                    <label for="json-text-input">Paste JSON content:</label>
                    <textarea 
                        id="json-text-input"
                        bind:value={jsonText}
                        placeholder="Paste your JSON deck data here..."
                        class="json-input-textarea"
                    ></textarea>
                    <button 
                        class="action-button primary"
                        onclick={handleTextImport}
                        disabled={isImporting || !jsonText.trim()}
                    >
                        {isImporting ? 'Parsing...' : 'Import from Text'}
                    </button>
                </div>
            {/if}
        {:else}
            <div class="import-preview">
                <h3>✅ Deck Loaded</h3>
                <div class="deck-preview">
                    <h4>{importedDeck.meta.title}</h4>
                    <div class="deck-meta">
                        <span>{importedDeck.cards.length} cards</span>
                        <span>Created {new Date(importedDeck.meta.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                
                {#if needsMerge}
                    <div class="merge-warning">
                        <h4>⚠️ Merge Required</h4>
                        <p>A deck with this ID already exists. You'll need to choose how to handle conflicts.</p>
                    </div>
                {/if}
                
                <div class="import-actions">
                    <button class="action-button primary" onclick={proceedWithImport}>
                        {needsMerge ? 'Open Merge Tool' : 'Import Deck'}
                    </button>
                    <button class="action-button" onclick={clearImport}>
                        Import Different Deck
                    </button>
                </div>
            </div>
        {/if}
        
        {#if isImporting}
            <div class="loading">Processing JSON...</div>
        {/if}
        
        {#if error}
            <div class="error">{error}</div>
        {/if}
        
        <div class="import-info">
            <p><strong>Supported formats:</strong> JSON files exported from this application or compatible deck formats.</p>
        </div>
    </div>
</div>

<style>
    .json-import-dialog {
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
    
    .import-methods h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .method-tabs {
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
    }
    
    .method-tab {
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }
    
    .method-tab:hover {
        color: var(--ui-text, #1a202c);
        background: var(--ui-hover-bg, #f8fafc);
    }
    
    .method-tab.active {
        color: var(--button-primary-bg, #3b82f6);
        border-bottom-color: var(--button-primary-bg, #3b82f6);
    }
    
    .file-drop-zone {
        position: relative;
    }
    
    .file-input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        z-index: 2;
    }
    
    .file-drop-label {
        display: block;
        cursor: pointer;
    }
    
    .file-drop-content {
        border: 2px dashed var(--ui-border, #e2e8f0);
        border-radius: 8px;
        padding: 3rem 2rem;
        text-align: center;
        transition: all 0.2s;
    }
    
    .file-drop-content:hover {
        border-color: var(--button-primary-bg, #3b82f6);
        background: rgba(59, 130, 246, 0.05);
    }
    
    .file-drop-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .file-drop-content p {
        margin: 0.5rem 0;
        color: var(--ui-text, #1a202c);
    }
    
    .file-drop-hint {
        color: var(--ui-muted, #64748b) !important;
        font-size: 0.875rem !important;
    }
    
    .text-import label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
    }
    
    .json-input-textarea {
        width: 100%;
        min-height: 200px;
        padding: 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 0.75rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        resize: vertical;
        line-height: 1.4;
        margin-bottom: 1rem;
    }
    
    .json-input-textarea:focus {
        outline: none;
        border-color: var(--button-primary-bg, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .import-preview h3 {
        margin: 0 0 1rem 0;
        color: var(--button-primary-bg, #3b82f6);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .deck-preview {
        background: var(--ui-hover-bg, #f8fafc);
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .deck-preview h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .deck-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: var(--ui-muted, #64748b);
    }
    
    .merge-warning {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
        border: 1px solid #fbbf24;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .merge-warning h4 {
        margin: 0 0 0.5rem 0;
        color: #92400e;
        font-size: 1rem;
    }
    
    .merge-warning p {
        margin: 0;
        color: #78350f;
        font-size: 0.875rem;
    }
    
    .import-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .action-button {
        padding: 0.75rem 1rem;
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
    
    .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .loading {
        text-align: center;
        padding: 2rem;
        color: var(--ui-muted, #64748b);
        font-style: italic;
    }
    
    .import-info {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 6px;
        padding: 1rem;
    }
    
    .import-info p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--ui-text, #1a202c);
    }
    
    .error {
        color: var(--toast-error, #dc2626);
        font-size: 0.875rem;
        text-align: center;
        padding: 0.75rem;
        background: rgba(220, 38, 38, 0.1);
        border-radius: 4px;
    }
</style>
