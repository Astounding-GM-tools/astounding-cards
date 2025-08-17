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
        padding: 1.5em;
        border-radius: 4px;
        border: none;
        min-width: 20em;
        max-width: 90vw;
        max-height: 90vh;
    }

    dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
    }
</style>