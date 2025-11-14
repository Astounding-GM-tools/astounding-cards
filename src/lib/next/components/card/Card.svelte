<script lang="ts">
	import type { Snippet } from 'svelte';

	import CardEditDialog from '$lib/next/components/dialogs/CardEditDialog.svelte';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.js';

	const { children, preview, cardId } = $props<{
		children?: Snippet;
		cardId?: string;
		preview?: boolean;
	}>();

	function openCardEditor() {
		dialogStore.setContent(CardEditDialog, { cardId: cardId || '' });
	}
</script>

<button
	class="card"
	class:preview
	onclick={!preview ? openCardEditor : null}
	aria-label="Click to edit card"
>
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
		border: 1px solid #000;
		box-sizing: border-box; /* Border drawn inside the element */
		z-index: 1000; /* Much higher to avoid being covered by other cards */
		pointer-events: none; /* Don't interfere with card interactions */
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

	/* CROP MARK THICKNESS ADJUSTMENTS for perfect visual weight */

	/* TAROT LAYOUT (2x2 grid) */
	/* Adjacent horizontal crop marks - make vertical borders thinner */
	/* Cards 1&2 horizontal adjacency */
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(1) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(1) .crop-mark.bottom-right {
		border-left-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(2) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(2) .crop-mark.bottom-left {
		border-right-width: 0.5px;
	}

	/* Cards 3&4 horizontal adjacency */
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(3) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(3) .crop-mark.bottom-right {
		border-left-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(4) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(4) .crop-mark.bottom-left {
		border-right-width: 0.5px;
	}

	/* Adjacent vertical crop marks - make horizontal borders thinner */
	/* Cards 1&3 vertical adjacency */
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(1) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(1) .crop-mark.bottom-right {
		border-top-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(3) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(3) .crop-mark.top-right {
		border-bottom-width: 0.5px;
	}

	/* Cards 2&4 vertical adjacency */
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(2) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(2) .crop-mark.bottom-right {
		border-top-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(4) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='tarot']) .card:nth-child(4) .crop-mark.top-right {
		border-bottom-width: 0.5px;
	}

	/* POKER LAYOUT (3x3 grid) */
	/* Adjacent horizontal crop marks - make vertical borders thinner */
	/* Row 1: Cards 1&2, 2&3 */
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(1) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(1) .crop-mark.bottom-right {
		border-left-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(2) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(2) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(2) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(2) .crop-mark.bottom-right {
		border-right-width: 0.5px;
		border-left-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(3) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(3) .crop-mark.bottom-left {
		border-right-width: 0.5px;
	}

	/* Row 2: Cards 4&5, 5&6 */
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(4) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(4) .crop-mark.bottom-right {
		border-left-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(5) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(5) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(5) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(5) .crop-mark.bottom-right {
		border-right-width: 0.5px;
		border-left-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(6) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(6) .crop-mark.bottom-left {
		border-right-width: 0.5px;
	}

	/* Row 3: Cards 7&8, 8&9 */
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(7) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(7) .crop-mark.bottom-right {
		border-left-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(8) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(8) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(8) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(8) .crop-mark.bottom-right {
		border-right-width: 0.5px;
		border-left-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(9) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(9) .crop-mark.bottom-left {
		border-right-width: 0.5px;
	}

	/* Adjacent vertical crop marks - make horizontal borders thinner */
	/* Column 1: Cards 1&4, 4&7 */
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(1) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(1) .crop-mark.bottom-right {
		border-top-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(4) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(4) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(4) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(4) .crop-mark.bottom-right {
		border-bottom-width: 0.5px;
		border-top-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(7) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(7) .crop-mark.top-right {
		border-bottom-width: 0.5px;
	}

	/* Column 2: Cards 2&5, 5&8 */
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(2) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(2) .crop-mark.bottom-right {
		border-top-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(5) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(5) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(5) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(5) .crop-mark.bottom-right {
		border-bottom-width: 0.5px;
		border-top-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(8) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(8) .crop-mark.top-right {
		border-bottom-width: 0.5px;
	}

	/* Column 3: Cards 3&6, 6&9 */
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(3) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(3) .crop-mark.bottom-right {
		border-top-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(6) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(6) .crop-mark.top-right,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(6) .crop-mark.bottom-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(6) .crop-mark.bottom-right {
		border-bottom-width: 0.5px;
		border-top-width: 0.5px;
	}
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(9) .crop-mark.top-left,
	:global(.print-layout .page[data-layout='poker']) .card:nth-child(9) .crop-mark.top-right {
		border-bottom-width: 0.5px;
	}

	@media print {
		.card {
			page-break-inside: avoid;
			page-break-after: auto;
		}
		/* Crop marks are selectively enabled by Page.svelte rules */
	}
</style>
