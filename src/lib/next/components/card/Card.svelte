<script lang="ts">
	import type { Snippet } from 'svelte';

    import CardEditDialog from '$lib/next/components/dialogs/CardEditDialog.svelte';
    import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.js';

	const {
		children,
		preview,
		cardId
	} = $props<{
		children?: Snippet;
		cardId?: string;
		preview?: boolean;
	}>();
    
    function openCardEditor() {
        dialogStore.setContent(CardEditDialog, { cardId: cardId || '' });
    }
</script>

<button class="card" class:preview onclick={ !preview ? openCardEditor : null } aria-label="Click to edit card">
	<div class="crop-mark top-left"></div>
	<div class="crop-mark top-right"></div>
	<div class="crop-mark bottom-left"></div>
	<div class="crop-mark bottom-right"></div>

	{#if children}
		{@render children()}
	{/if}
</button>

<style>
	.card {
        all: unset;
		aspect-ratio: 5/7;
		color: var(--color);
        background: white;
		display: flex;
		flex-direction: column;
		flex: 0 0 auto;
		font-family: var(--font-body);
		position: relative;
        cursor: pointer;
        height: 100%;
        width: 100%;
        transition: opacity 0.2s ease;
        direction: ltr;
        z-index: 2;

		container-type: inline-size;
		container-name: card;
	}
        .card:hover {
        opacity: 0.9;
    }
    
    .card:active {
        transform: scale(0.98);
    }

    .card.preview {
        cursor: default;
        pointer-events: none;
    }
    .card.preview:hover {
        opacity: 1;
    }

    .card.preview:active {
        transform: none;
    }

    .crop-mark {
        --crop-offset: calc(-1 * var(--page-padding));
        position: absolute;
        width: var(--page-padding);
        height: var(--page-padding);
        border: 0.25mm solid #000;
        z-index: 1;
        /* Hidden by default, selectively shown only on page edges */
        display: none;
    }

	.crop-mark.top-left {
		top: var(--crop-offset);
		left: var(--crop-offset);
		border-left-style: none;
		border-top-style: none;
	}

	.crop-mark.top-right {
		top: var(--crop-offset);
		right: var(--crop-offset);
		border-right-style: none;
		border-top-style: none;
	}

	.crop-mark.bottom-left {
		bottom: var(--crop-offset);
		left: var(--crop-offset);
		border-left-style: none;
		border-bottom-style: none;
	}

	.crop-mark.bottom-right {
		bottom: var(--crop-offset);
		right: var(--crop-offset);
		border-right-style: none;
		border-bottom-style: none;
	}

    @media print {
        .card {
            page-break-inside: avoid;
            page-break-after: auto;
        }
        /* Crop marks are selectively enabled by Page.svelte rules */
    }
</style>
