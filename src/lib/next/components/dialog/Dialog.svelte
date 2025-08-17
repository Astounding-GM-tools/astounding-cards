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

    $effect(() => {
        if (dialogStore.isOpen) {
            dialog?.showModal();
        } else {
            dialog?.close();
        }
    });
</script>

<dialog 
    bind:this={dialog}
    onclose={() => dialogStore.close()}
>
    {#if dialogStore.content}
        {@render dialogStore.content()}
    {/if}
</dialog>

<style>
    dialog {
        min-width: 24em;
        max-width: min(90vw, 48em);
        max-height: 90vh;
        padding: 2em;
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
        overflow: auto;
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