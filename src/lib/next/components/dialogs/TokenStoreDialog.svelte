<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import TokenStore from '../store/TokenStore.svelte';
	import { goto } from '$app/navigation';

	function handleGoToDashboard() {
		dialogStore.close();
		goto('/dashboard');
	}
</script>

<div class="token-store-dialog">
	<div class="dialog-header">
		<h2>Buy Tokens</h2>
		<button class="close-button" onclick={() => dialogStore.close()}>✕</button>
	</div>

	<div class="dialog-content">
		<TokenStore compact={false} />

		<div class="dashboard-link">
			<p>Want to manage your tokens and see your balance?</p>
			<button class="secondary-button" onclick={handleGoToDashboard}>
				Go to Dashboard
			</button>
		</div>
	</div>
</div>

<style>
	.token-store-dialog {
		background: white;
		border-radius: 8px;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow: auto;
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
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--ui-muted, #64748b);
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		color: var(--ui-text, #1a202c);
	}

	.dialog-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.dashboard-link {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: var(--ui-hover-bg, #f8fafc);
		border-radius: 6px;
		border: 1px solid var(--ui-border, #e2e8f0);
		text-align: center;
	}

	.dashboard-link p {
		margin: 0;
		color: var(--ui-muted, #64748b);
		font-size: 0.875rem;
	}

	.secondary-button {
		padding: 0.75rem 1.5rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: white;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.secondary-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
	}
</style>
