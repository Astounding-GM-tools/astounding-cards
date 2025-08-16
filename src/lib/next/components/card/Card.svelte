<script lang="ts">
    import type { Snippet } from 'svelte';

    const { children } = $props<{
        children?: Snippet;
    }>();
</script>

<article class="card">
    <div class="crop-mark top-left"></div>
    <div class="crop-mark top-right"></div>
    <div class="crop-mark bottom-left"></div>
    <div class="crop-mark bottom-right"></div>
    
    {#if children}
        {@render children()}
    {/if}
</article>

<style>
    @import './Card.css';
</style>
