<script lang="ts">
	import type { Deck } from '$lib/next/types/deck';
	import { dialogStore } from '../dialog/dialogStore.svelte';

	const { decks, currentDeckId, onMerge } = $props<{
		decks: Deck[];
		currentDeckId: string;
		onMerge: (sourceDeckId: string) => Promise<void>;
	}>();

	let selectedDeckId = $state('');
	let isSaving = $state(false);

	const availableDecks = $derived(decks.filter((d) => d.id !== currentDeckId));

	async function handleMerge() {
		if (!selectedDeckId) return;
		isSaving = true;
		try {
			await onMerge(selectedDeckId);
			dialogStore.close();
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="merge-dialog">
	<h2>Merge Decks</h2>
	<p>Select a deck to merge its cards into the current deck. The selected deck will not be changed.</p>
	<select bind:value={selectedDeckId}>
		<option value="">Select a deck...</option>
		{#each availableDecks as deck}
			<option value={deck.id}>{deck.meta.title}</option>
		{/each}
	</select>
	<div class="dialog-buttons">
		<button class="secondary" onclick={() => dialogStore.close()} disabled={isSaving}>Cancel</button>
		<button class="primary" onclick={handleMerge} disabled={isSaving || !selectedDeckId}>
			{isSaving ? 'Merging...' : 'Merge'}
		</button>
	</div>
</div>

<style>
	.merge-dialog {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
	}
	h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}
	select {
		padding: 0.5rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		font-size: 1rem;
	}
	.dialog-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	button {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
	}
	.primary {
		background: var(--brand, #c90019);
		color: white;
		border: none;
	}
	.secondary {
		background: var(--ui-hover-bg, #f8fafc);
		color: var(--ui-text, #1a202c);
		border: 1px solid var(--ui-border, #e2e8f0);
	}
</style>
