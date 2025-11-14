<script lang="ts">
	import { deckList } from '$lib/stores/deckList';
	import DeckManager from './DeckManager.svelte';
	import { sortDecksByLastEdited, createDeckChangeHandler } from './DeckList.svelte.ts';

	// Initialize the store
	$effect(() => {
		deckList.load();
	});

	let handleDeckChange = $state(createDeckChangeHandler(deckList));

	// Expose the method for parent component access
	export { handleDeckChange };

	const sortedDecks = $derived(sortDecksByLastEdited($deckList.decks));
</script>

<div class="deck-list">
	{#if $deckList.loading}
		<div class="message">Loading decks...</div>
	{:else if $deckList.error}
		<div class="message error">{$deckList.error}</div>
	{:else if $deckList.decks.length === 0}
		<div class="message">No decks found. Create your first deck using the selector above.</div>
	{:else}
		<div class="decks">
			{#each sortedDecks as deck (deck.id)}
				<DeckManager {deck} ondeckchange={handleDeckChange} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.deck-list {
		padding: var(--content-gap);
		background: var(--ui-bg);
	}

	.decks {
		display: flex;
		flex-direction: column;
		gap: var(--content-gap);
	}

	/* Use global message styles with specific overrides */
	.message {
		font-style: italic;
		background: var(--ui-bg);
		border: 1px solid var(--ui-border);
		border-radius: 4px;
	}

	.error {
		border-color: var(--toast-error);
		background: rgba(244, 67, 54, 0.05);
	}
</style>
