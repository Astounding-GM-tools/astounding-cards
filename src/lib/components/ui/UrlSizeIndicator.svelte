<script lang="ts">
	import { deckToUrl } from '$lib/stores/deck';
	import type { Deck } from '$lib/types';
	import { browser } from '$app/environment';
	import {
		getUrlSizeInfo,
		getWarningMessage,
		type UrlSizeInfo
	} from './UrlSizeIndicator.svelte.ts';

	const props = $props();
	const deck = props.deck as Deck;

	const urlSizeInfo = $derived<UrlSizeInfo>(
		browser
			? getUrlSizeInfo(deckToUrl(deck))
			: {
					urlSize: 0,
					sizeInKB: '0.0',
					warningLevel: 'low'
				}
	);

	const warningMessage = $derived(getWarningMessage(urlSizeInfo.warningLevel));
</script>

<div class="size-indicator {urlSizeInfo.warningLevel}">
	URL Size: {urlSizeInfo.sizeInKB}KB
	{#if warningMessage}
		<span class="warning">{warningMessage}</span>
	{/if}
</div>

<style>
	.size-indicator {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: var(--ui-font-size);
		font-family: var(--ui-font-family);
	}

	.low {
		background: rgba(76, 175, 80, 0.1);
		color: var(--toast-success);
	}

	.medium {
		background: rgba(255, 152, 0, 0.1);
		color: var(--toast-warning);
	}

	.high {
		background: rgba(244, 67, 54, 0.1);
		color: var(--toast-error);
	}

	.warning {
		font-style: italic;
		font-family: var(--ui-font-family);
	}
</style>
