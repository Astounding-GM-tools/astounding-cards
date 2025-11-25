<script lang="ts">
	import MainHeader from './MainHeader.svelte';
	import { LogOut, ShoppingCart } from 'lucide-svelte';

	function handleLogOut() {
		alert('Log out');
	}

	function handleBuyTokens() {
		alert('Buy tokens');
	}
</script>

<MainHeader title="Dashboard" mockIsAuthenticated={true} mockUserEmail="user@example.com" mockDeckCount={12} mockTokenBalance={4500}>
	{#snippet actions()}
		<div class="dashboard-actions">
			<button class="action-button" onclick={handleBuyTokens}>
				<ShoppingCart size={16} />
				<span>Buy Tokens</span>
			</button>

			<button class="action-button" onclick={handleLogOut}>
				<LogOut size={16} />
				<span>Log Out</span>
			</button>
		</div>
	{/snippet}
</MainHeader>

<style>
	.dashboard-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.action-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 6px;
		background: var(--brand);
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.action-button:hover {
		background: #a80116;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.action-button.primary {
		background: var(--brand);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
</style>
