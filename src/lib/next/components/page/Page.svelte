<script lang="ts">
    import type { PageLayout } from './types';
    import type { Snippet } from 'svelte';
    
    const { layout = 'poker', children } = $props<{
        layout?: PageLayout;
        children?: Snippet;
    }>();
</script>

<section class="page" data-layout={layout}>
    {#if children}
        {@render children()}
    {/if}
</section>

<style>
    .page {
        display: grid;
        padding: var(--page-padding);
        
        /* Default grid: tarot layout */
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
    }

    .page[data-layout="poker"] {
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
    }
</style>
