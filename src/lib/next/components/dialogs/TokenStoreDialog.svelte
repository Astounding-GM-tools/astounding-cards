<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import { ShoppingCart } from 'lucide-svelte';
	import TokenStore from '../store/TokenStore.svelte';
</script>

<div class="token-store-dialog">
	<div class="dialog-header">
		<div class="header-content">
			<ShoppingCart size={24} />
			<h2>Buy Tokens</h2>
		</div>
		<button class="close-button" onclick={() => dialogStore.close()}>×</button>
	</div>

	<div class="dialog-content">
		<TokenStore showComingSoon={true} />
	</div>
</div>

<style>
	.token-store-dialog {
		background: white;
		border-radius: 12px;
		max-width: 500px;
		width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-content h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--ui-text, #1a202c);
	}

	.close-button {
		background: none;
		border: none;
		font-size: 2rem;
		cursor: pointer;
		padding: 0;
		color: var(--ui-muted, #64748b);
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.close-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		color: var(--ui-text, #1a202c);
	}

	.dialog-content {
		flex: 1;
		padding: 2rem;
		overflow-y: auto;
	}
</style>
