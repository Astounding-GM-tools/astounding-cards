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
        
        /* Create new stacking context to fix crop mark z-index issues */
        isolation: isolate;
    }

    .page[data-layout="poker"] {
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
    }
    
    /* Back pages use RTL for proper double-sided printing alignment */
    .page[data-page-type="back"] {
        direction: rtl;
    }
    
    
    /* Remove page break from last page to prevent blank page */
    .page:last-child {
        page-break-after: auto;
    }
    
    @media print {
        .page {
            width: auto;
            height: auto;
            min-height: 100vh;
            margin: 0;
            box-shadow: none;
        }
        
        /* Ensure last page doesn't force a blank page */
        .page:last-child {
            page-break-after: auto;
        }
        
        /* SELECTIVE CROP MARKS: Only show on actual page edges */
        
        /* TAROT LAYOUT (2x2 grid) */
        /* Top row (cards 1-2): show top crop marks */
        .page[data-layout="tarot"] :global(.card:nth-child(-n+2) .crop-mark.top-left),
        .page[data-layout="tarot"] :global(.card:nth-child(-n+2) .crop-mark.top-right) {
            display: block;
        }
        
        /* Bottom row (cards 3-4): show bottom crop marks */
        .page[data-layout="tarot"] :global(.card:nth-child(n+3) .crop-mark.bottom-left),
        .page[data-layout="tarot"] :global(.card:nth-child(n+3) .crop-mark.bottom-right) {
            display: block;
        }
        
        /* Left column (cards 1,3): show left crop marks */
        .page[data-layout="tarot"] :global(.card:nth-child(odd) .crop-mark.top-left),
        .page[data-layout="tarot"] :global(.card:nth-child(odd) .crop-mark.bottom-left) {
            display: block;
        }
        
        /* Right column (cards 2,4): show right crop marks */
        .page[data-layout="tarot"] :global(.card:nth-child(even) .crop-mark.top-right),
        .page[data-layout="tarot"] :global(.card:nth-child(even) .crop-mark.bottom-right) {
            display: block;
        }
        
        /* POKER LAYOUT (3x3 grid) */
        /* Top row (cards 1-3): show top crop marks */
        .page[data-layout="poker"] :global(.card:nth-child(-n+3) .crop-mark.top-left),
        .page[data-layout="poker"] :global(.card:nth-child(-n+3) .crop-mark.top-right) {
            display: block;
        }
        
        /* Bottom row (cards 7-9): show bottom crop marks */
        .page[data-layout="poker"] :global(.card:nth-child(n+7) .crop-mark.bottom-left),
        .page[data-layout="poker"] :global(.card:nth-child(n+7) .crop-mark.bottom-right) {
            display: block;
        }
        
        /* Left column (cards 1,4,7): show left crop marks */
        .page[data-layout="poker"] :global(.card:nth-child(3n+1) .crop-mark.top-left),
        .page[data-layout="poker"] :global(.card:nth-child(3n+1) .crop-mark.bottom-left) {
            display: block;
        }
        
        /* Right column (cards 3,6,9): show right crop marks */
        .page[data-layout="poker"] :global(.card:nth-child(3n) .crop-mark.top-right),
        .page[data-layout="poker"] :global(.card:nth-child(3n) .crop-mark.bottom-right) {
            display: block;
        }
        
        @page {
            margin: 0;
            size: auto;
        }
    }
</style>
