<script lang="ts">
    import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte';
    console.log('Some Content Loaded in a dialog!');
</script>

<div>
    <h1>Some Content</h1>
</div>

<button onclick={() => {
    console.log('Do something, like saving data, then close the dialog');
    dialogStore.close();
    console.log('Dialog closed');
}}>
    Close
</button>

<style>

    div {
        background-color: blue;
        color: white;
        padding: 20px;
        border: 1px solid green;
        border-radius: 16px;
    }
</style>