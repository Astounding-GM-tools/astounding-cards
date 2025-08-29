<script lang="ts">
    import { dialogStore } from '../dialog/dialogStore.svelte.js';
    import { toasts } from '$lib/stores/toast.js';
    import type { Deck } from '$lib/next/types/deck.js';
    
    interface Props {
        deck: Deck;
    }
    
    const { deck }: Props = $props();
    
    // Local state
    let isExporting = $state(false);
    let exportedJson = $state<string | null>(null);
    let error = $state<string | null>(null);
    let exportOptions = $state({
        includeImages: true,
        prettyFormat: true,
        includeMetadata: true
    });
    
    async function exportToJson() {
        isExporting = true;
        error = null;
        
        try {
            // TODO: Implement JSON export logic
            // This will serialize the deck based on options
            const exportData = {
                version: '1.0',
                deck: deck,
                exported: new Date().toISOString(),
                options: exportOptions
            };
            
            exportedJson = exportOptions.prettyFormat 
                ? JSON.stringify(exportData, null, 2)
                : JSON.stringify(exportData);
                
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to export deck';
        } finally {
            isExporting = false;
        }
    }
    
    function downloadJson() {
        if (!exportedJson) return;
        
        try {
            const blob = new Blob([exportedJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${deck.meta.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toasts.success('JSON file downloaded successfully!');
        } catch (err) {
            toasts.error('Failed to download JSON file');
            console.error('Download error:', err);
        }
    }
    
    async function copyToClipboard() {
        if (!exportedJson) return;
        
        try {
            await navigator.clipboard.writeText(exportedJson);
            toasts.success('JSON copied to clipboard!');
        } catch (err) {
            toasts.error('Failed to copy JSON to clipboard');
            console.error('Clipboard error:', err);
        }
    }
    
    // Auto-export when dialog opens
    $effect(() => {
        exportToJson();
    });
</script>

<div class="json-export-dialog">
    <div class="dialog-header">
        <h2>📄 Export JSON</h2>
        <button class="close-button" onclick={() => dialogStore.close()}>×</button>
    </div>
    
    <div class="dialog-content">
        <div class="deck-info">
            <h3>{deck.meta.title}</h3>
            <p>{deck.cards.length} cards • Export to JSON format</p>
        </div>
        
        <div class="export-options">
            <h4>Export Options</h4>
            <div class="options-grid">
                <label class="checkbox-label">
                    <input 
                        type="checkbox" 
                        bind:checked={exportOptions.includeImages}
                        onchange={exportToJson}
                    />
                    Include images
                </label>
                
                <label class="checkbox-label">
                    <input 
                        type="checkbox" 
                        bind:checked={exportOptions.prettyFormat}
                        onchange={exportToJson}
                    />
                    Pretty formatting
                </label>
                
                <label class="checkbox-label">
                    <input 
                        type="checkbox" 
                        bind:checked={exportOptions.includeMetadata}
                        onchange={exportToJson}
                    />
                    Include metadata
                </label>
            </div>
        </div>
        
        {#if isExporting}
            <div class="loading">Exporting deck...</div>
        {:else if exportedJson}
            <div class="export-result">
                <div class="json-preview">
                    <label for="json-output">JSON Output:</label>
                    <textarea 
                        id="json-output"
                        readonly 
                        class="json-textarea"
                        value={exportedJson}
                    ></textarea>
                </div>
                
                <div class="export-actions">
                    <button class="action-button primary" onclick={downloadJson}>
                        💾 Download File
                    </button>
                    <button class="action-button" onclick={copyToClipboard}>
                        📋 Copy to Clipboard
                    </button>
                </div>
            </div>
        {/if}
        
        {#if error}
            <div class="error">{error}</div>
        {/if}
        
        <div class="export-info">
            <p><strong>Note:</strong> The exported JSON can be imported into any compatible deck application or shared with others.</p>
        </div>
    </div>
</div>

<style>
    .json-export-dialog {
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
    
    .deck-info h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .deck-info p {
        margin: 0;
        color: var(--ui-muted, #64748b);
        font-size: 0.875rem;
    }
    
    .export-options h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 500;
    }
    
    .options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.75rem;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        cursor: pointer;
    }
    
    .checkbox-label input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
        cursor: pointer;
    }
    
    .loading {
        text-align: center;
        padding: 2rem;
        color: var(--ui-muted, #64748b);
        font-style: italic;
    }
    
    .export-result {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .json-preview label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--ui-text, #1a202c);
        font-size: 0.875rem;
    }
    
    .json-textarea {
        width: 100%;
        min-height: 200px;
        max-height: 300px;
        padding: 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 4px;
        font-size: 0.75rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        background: var(--ui-hover-bg, #f8fafc);
        resize: vertical;
        line-height: 1.4;
    }
    
    .export-actions {
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
    
    .export-info {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 6px;
        padding: 1rem;
    }
    
    .export-info p {
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
