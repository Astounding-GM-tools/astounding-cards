<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import type { Deck } from '$lib/next/types/deck.js';

	interface Props {
		deck: Deck;
		onConfirm: () => void | Promise<void>;
	}

	const { deck, onConfirm }: Props = $props();

	let isDeleting = $state(false);

	async function handleConfirm() {
		isDeleting = true;
		try {
			await onConfirm();
			dialogStore.close();
		} catch (error) {
			console.error('Delete failed:', error);
			isDeleting = false;
		}
	}

	function handleCancel() {
		dialogStore.close();
	}
</script>

<div class="delete-deck-dialog">
	<div class="dialog-header">
		<h2>🗑️ Delete Deck</h2>
		<button class="close-button" onclick={handleCancel}>×</button>
	</div>

	<div class="dialog-content">
		<div class="warning-section">
			<p class="warning-text">
				Are you sure you want to delete <strong>"{deck.meta.title}"</strong>?
			</p>
			<p class="details">This action cannot be undone. The deck will be permanently removed.</p>
		</div>

		<div class="deck-info">
			<span>{deck.cards.length} {deck.cards.length === 1 ? 'card' : 'cards'}</span>
			<span>•</span>
			<span>{deck.meta.theme}</span>
		</div>
	</div>

	<div class="dialog-footer">
		<button class="action-button secondary" onclick={handleCancel} disabled={isDeleting}>
			Cancel
		</button>
		<button class="action-button danger" onclick={handleConfirm} disabled={isDeleting}>
			{isDeleting ? 'Deleting...' : 'Delete Deck'}
		</button>
	</div>
</div>

<style>
	.delete-deck-dialog {
		background: white;
		border-radius: 8px;
		max-width: 450px;
		width: 90vw;
		display: flex;
		flex-direction: column;
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		color: var(--ui-muted, #64748b);
		border-radius: 4px;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		color: var(--ui-text, #1a202c);
	}

	.dialog-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.warning-section {
		background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
		border: 1px solid #dc2626;
		border-radius: 6px;
		padding: 1rem;
	}

	.warning-text {
		margin: 0 0 0.75rem 0;
		color: #991b1b;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.warning-text strong {
		color: #7f1d1d;
	}

	.details {
		margin: 0;
		color: #991b1b;
		font-size: 0.875rem;
		opacity: 0.9;
	}

	.deck-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--ui-muted, #64748b);
		font-size: 0.875rem;
		justify-content: center;
		padding: 0.5rem;
		background: var(--ui-hover-bg, #f8fafc);
		border-radius: 4px;
	}

	.dialog-footer {
		display: flex;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid var(--ui-border, #e2e8f0);
	}

	.action-button {
		flex: 1;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-button.secondary {
		background: var(--ui-hover-bg, #f8fafc);
		color: var(--ui-text, #1a202c);
		border: 1px solid var(--ui-border, #e2e8f0);
	}

	.action-button.secondary:hover:not(:disabled) {
		background: var(--ui-border, #e2e8f0);
	}

	.action-button.danger {
		background: #dc2626;
		color: white;
	}

	.action-button.danger:hover:not(:disabled) {
		background: #b91c1c;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
</style>
