<script lang="ts">
	import { toasts } from '$lib/stores/toast';
	import { dialogStore } from '../dialog/dialogStore.svelte';

	const { deck, onRenamed } = $props<{
		deck: { id: string; title: string };
		onRenamed: (newTitle: string) => Promise<void>;
	}>();

	let newTitle = $state(deck.title);
	let isSaving = $state(false);

	async function handleSave() {
		if (!newTitle.trim() || newTitle.trim() === deck.title) {
			dialogStore.close();
			return;
		}
		isSaving = true;
		try {
			await onRenamed(newTitle.trim());
			dialogStore.close();
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="rename-dialog">
	<h2>Rename Deck</h2>
	<input
		type="text"
		bind:value={newTitle}
		onkeydown={(e) => e.key === 'Enter' && handleSave()}
		placeholder="Enter new deck name"
	/>
	<div class="dialog-buttons">
		<button class="secondary" onclick={() => dialogStore.close()} disabled={isSaving}>Cancel</button>
		<button class="primary" onclick={handleSave} disabled={isSaving}>
			{isSaving ? 'Saving...' : 'Rename'}
		</button>
	</div>
</div>

<style>
	.rename-dialog {
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
	input {
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
