<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		icon: Snippet;
		title: string;
		subtitle?: string;
		variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
		disabled?: boolean;
		loading?: boolean;
		filled?: boolean;
		onclick?: () => void;
	}

	let {
		icon,
		title,
		subtitle,
		variant = 'primary',
		disabled = false,
		loading = false,
		filled = false,
		onclick
	}: Props = $props();
</script>

<button class="action-button {variant}" {disabled} {onclick}>
	<div class="action-icon" class:filled>
		{@render icon()}
	</div>
	<div class="action-text">
		<div class="action-title">{title}</div>
		{#if subtitle}
			<div class="action-subtitle">{subtitle}</div>
		{/if}
		{#if loading}
			<div class="action-subtitle">
				<span class="spinner"></span>
				<span>Syncing...</span>
			</div>
		{/if}
	</div>
</button>

<style>
	.action-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: white;
		color: var(--ui-text, #1a202c);
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.action-button:hover:not(:disabled) {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 4px;
		background: var(--ui-bg, #f8fafc);
	}

	/* Filled icon (for hearts, etc) */
	.action-icon.filled :global(svg) {
		fill: var(--brand);
	}

	.action-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.action-title {
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--ui-text, #1a202c);
	}

	.action-subtitle {
		font-size: 0.75rem;
		line-height: 1.2;
		color: var(--ui-text-secondary, #64748b);
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	/* Variants */
	.action-button.primary .action-icon {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	.action-button.secondary .action-icon {
		background: rgba(100, 116, 139, 0.1);
		color: #64748b;
	}

	.action-button.success .action-icon {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}

	.action-button.warning .action-icon {
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
	}

	.action-button.danger .action-icon {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	/* Loading spinner */
	.spinner {
		display: inline-block;
		width: 10px;
		height: 10px;
		border: 2px solid rgba(100, 116, 139, 0.3);
		border-top: 2px solid #64748b;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.action-button {
			min-width: 140px;
			padding: 0.625rem 0.75rem;
			gap: 0.5rem;
		}

		.action-icon {
			width: 32px;
			height: 32px;
		}

		.action-title {
			font-size: 0.8125rem;
		}

		.action-subtitle {
			font-size: 0.6875rem;
		}
	}

	@container action-bar (width < 400px) {
		.action-button {
			padding: 0;
			min-width: auto;
		}

		.action-text {
			display: none;
		}
	}
</style>
