<script lang="ts">
    import type { PageLayout } from './types';
    import type { Snippet } from 'svelte';
    
    const { layout = 'poker', children, pageType = 'front' } = $props<{
        layout?: PageLayout;
        children?: Snippet;
        pageType?: 'front' | 'back';
    }>();
</script>

<section class="page" data-layout={layout} data-page-type={pageType}>
    {#if children}
        {@render children()}
    {/if}
</section>

<style>
    .page {
        display: grid;
        padding: var(--page-padding, 10mm);
        gap: 0;
        
        /* Default grid: tarot layout */
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        margin: 0 auto 20mm auto;
        min-width: 210mm;
        max-width: 215.9mm;
        width: 100%;
        min-height: 297mm;
        
        /* Print styles */
        page-break-after: always;
        page-break-inside: avoid;
        
        background: var(--page-bg, white);
        box-shadow: var(--page-shadow, 0 2px 8px rgba(0,0,0,0.1));
    }

    .page[data-layout="poker"] {
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
    }
    
    /* Back pages use RTL for proper double-sided printing alignment */
    .page[data-page-type="back"] {
        direction: rtl;
    }
    
    
    @media print {
        .page {
            width: auto;
            height: auto;
            min-height: 100vh;
            margin: 0;
            box-shadow: none;
        }
        
        @page {
            margin: 0;
            size: auto;
        }
    }
</style>
