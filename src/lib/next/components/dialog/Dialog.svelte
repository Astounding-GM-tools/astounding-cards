<!--
    Dialog System

    This is our single dialog wrapper - use this for ALL modal interactions
    instead of creating new dialog components. Just provide the content:

    dialogStore.setContent(MyEditor);

    Common uses:
    - Card property editors
    - Deck management
    - Statblock configuration

    Pattern for dialog content components:
    - Keep them focused on their specific task
    - Handle their own close/save logic
    - Can open other dialogs by setting new content
    - Clean up after themselves (store will help)

    Supports nested dialogs (e.g. deck → card → stat) by just setting new content.
    This keeps our dialog management simple and consistent across the app.
-->
<script lang="ts">
    import { dialogStore } from './dialogStore.svelte';
    let dialog: HTMLDialogElement;
    let isDialogOpen = false;

    $effect(() => {
        if (dialogStore.isOpen && !isDialogOpen) {
            dialog?.showModal();
            isDialogOpen = true;
            // Lock body scroll when dialog opens
            if (typeof window !== 'undefined') {
                document.body.style.overflow = 'hidden';
            }
        } else if (!dialogStore.isOpen && isDialogOpen) {
            dialog?.close();
            isDialogOpen = false;
            // Note: Scroll unlock is handled in handleClose() to avoid race conditions
        }
    });

    function handleClose() {
        isDialogOpen = false;
        dialogStore.close();
        
        // Explicitly restore body scroll - ensure it always happens
        if (typeof window !== 'undefined') {
            document.body.style.overflow = '';
        }
    }
    
    function handleDocumentKeyDown(e: KeyboardEvent) {
        // Only handle Escape when dialog is open
        if (e.key === 'Escape' && isDialogOpen) {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
        }
    }
    
    // Add/remove document keydown listener and cleanup on unmount
    $effect(() => {
        if (typeof window !== 'undefined') {
            if (isDialogOpen) {
                document.addEventListener('keydown', handleDocumentKeyDown);
            } else {
                document.removeEventListener('keydown', handleDocumentKeyDown);
            }
        }
        
        return () => {
            // Cleanup listener and scroll lock on unmount
            if (typeof window !== 'undefined') {
                document.removeEventListener('keydown', handleDocumentKeyDown);
                if (isDialogOpen) {
                    document.body.style.overflow = '';
                }
            }
        };
    });
</script>

<dialog 
    bind:this={dialog}
    onclose={handleClose}
>
    {#if dialogStore.content}
        {@const Component = dialogStore.content}
        <Component {...dialogStore.contentProps} />
    {/if}
</dialog>

<style>
    dialog {
        min-width: 24em;
        max-width: min(90vw, 48em);
        max-height: 90vh;
        padding: 0; /* Remove padding to let CardEditDialog control it */
        border: none;
        border-radius: 6px;
        box-shadow: 
            0 4px 6px rgba(0, 0, 0, 0.1),
            0 10px 15px -3px rgba(0, 0, 0, 0.1);
        
        /* Ensure consistent text rendering */
        -webkit-font-smoothing: antialiased;
        color: var(--color);
        background: white;

        /* Center it nicely */
        margin: auto;
        overflow: hidden; /* Let the dialog content handle scrolling */
        
        /* Modern CSS solution: Prevent scroll chaining to background */
        overscroll-behavior: contain;
        
        /* Ensure dialog stays on top */
        z-index: 9999;
        position: fixed;
    }

    dialog::backdrop {
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(2px);
    }

    /* Remove default focus outline and add our own */
    dialog:focus {
        outline: none;
        box-shadow: 
            0 0 0 3px var(--accent),
            0 4px 6px rgba(0, 0, 0, 0.1);
    }
</style>