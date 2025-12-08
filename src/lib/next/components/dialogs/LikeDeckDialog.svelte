<script lang="ts">
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte';
	import { toasts } from '$lib/stores/toast';
	import { user } from '$lib/next/stores/auth';
	import { getAuthHeaders } from '$lib/utils/auth-helpers';

	type Props = {
		deckId: string;
		deckTitle: string;
		isRemix: boolean;
		creatorName?: string;
		parentCreatorName?: string;
		onSuccess?: () => void;
	};

	let { deckId, deckTitle, isRemix, creatorName, parentCreatorName, onSuccess }: Props = $props();

	let loading = $state(false);

	async function handleLike() {
		if (!$user) {
			toasts.error('Please log in to like decks');
			dialogStore.close();
			return;
		}

		loading = true;

		try {
			const response = await fetch(`/api/decks/${deckId}/like`, {
				method: 'POST',
				headers: getAuthHeaders({
					'Content-Type': 'application/json'
				})
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				toasts.error(result.error || 'Failed to like deck');
				return;
			}

			// Success!
			toasts.success('❤️ Deck liked! Tokens sent to creators');
			dialogStore.close();

			// Trigger refresh callback
			if (onSuccess) {
				onSuccess();
			}
		} catch (error) {
			console.error('Like deck error:', error);
			toasts.error('Failed to like deck. Please try again.');
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		dialogStore.close();
	}
</script>

<div class="like-deck-dialog">
	<div class="icon">❤️</div>
	<h2>Like "{deckTitle}"?</h2>

	<div class="cost-breakdown">
		<div class="cost-header">
			<span class="token-icon">🪙</span>
			<span class="cost-amount">10 tokens</span>
		</div>

		{#if isRemix}
			<div class="distribution">
				<p class="distribution-label">Token distribution:</p>
				<div class="distribution-item">
					<span class="amount">5 tokens</span>
					<span class="arrow">→</span>
					<span class="recipient">{creatorName || 'Remix creator'}</span>
				</div>
				<div class="distribution-item">
					<span class="amount">5 tokens</span>
					<span class="arrow">→</span>
					<span class="recipient">{parentCreatorName || 'Original creator'}</span>
				</div>
			</div>
		{:else}
			<p class="distribution-simple">
				All tokens go to <strong>{creatorName || 'the creator'}</strong>
			</p>
		{/if}
	</div>

	<div class="info-box">
		<p class="info-text">
			Likes help creators earn tokens to make more amazing decks! Your support directly funds
			creative work in the community.
		</p>
	</div>

	<div class="actions">
		<button onclick={handleLike} class="btn-primary" disabled={loading}>
			{#if loading}
				Liking...
			{:else}
				❤️ Like for 10 Tokens
			{/if}
		</button>
		<button onclick={handleCancel} class="btn-secondary" disabled={loading}>Cancel</button>
	</div>

	<p class="note">You can unlike later, but tokens won't be refunded</p>
</div>

<style>
	.like-deck-dialog {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px;
		max-width: 480px;
		text-align: center;
	}

	.icon {
		font-size: 48px;
		margin-bottom: 16px;
		animation: heartbeat 1.5s infinite;
	}

	@keyframes heartbeat {
		0%,
		100% {
			transform: scale(1);
		}
		10%,
		30% {
			transform: scale(1.1);
		}
		20%,
		40% {
			transform: scale(1);
		}
	}

	h2 {
		font-size: 24px;
		font-weight: 600;
		margin: 0 0 24px;
		color: var(--ui-text, #1e293b);
	}

	.cost-breakdown {
		width: 100%;
		padding: 20px;
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
		border: 2px solid rgba(239, 68, 68, 0.2);
		border-radius: 12px;
		margin-bottom: 20px;
	}

	.cost-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.token-icon {
		font-size: 24px;
	}

	.cost-amount {
		font-size: 28px;
		font-weight: 700;
		color: var(--ui-text, #1e293b);
	}

	.distribution {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid rgba(239, 68, 68, 0.2);
	}

	.distribution-label {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0 0 12px;
		color: var(--ui-muted, #64748b);
	}

	.distribution-item {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 8px 0;
		font-size: 14px;
	}

	.distribution-item .amount {
		font-weight: 600;
		color: var(--ui-text, #1e293b);
	}

	.distribution-item .arrow {
		color: var(--ui-muted, #64748b);
	}

	.distribution-item .recipient {
		font-weight: 500;
		color: var(--ui-text, #1e293b);
	}

	.distribution-simple {
		margin: 12px 0 0;
		font-size: 14px;
		color: var(--ui-text, #1e293b);
	}

	.distribution-simple strong {
		font-weight: 600;
	}

	.info-box {
		width: 100%;
		padding: 16px;
		background: rgba(59, 130, 246, 0.1);
		border-radius: 8px;
		margin-bottom: 24px;
	}

	.info-text {
		margin: 0;
		font-size: 13px;
		line-height: 1.6;
		color: var(--ui-text, #1e293b);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
		margin-bottom: 16px;
	}

	.btn-primary,
	.btn-secondary {
		padding: 14px 24px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		font: inherit;
	}

	.btn-primary {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: rgba(0, 0, 0, 0.05);
		color: var(--ui-text, #1e293b);
		border: 1px solid var(--ui-border, #e2e8f0);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.1);
	}

	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.note {
		font-size: 12px;
		opacity: 0.6;
		margin: 0;
		color: var(--ui-muted, #64748b);
	}
</style>
