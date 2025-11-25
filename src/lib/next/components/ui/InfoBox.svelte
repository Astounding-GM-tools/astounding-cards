<script lang="ts">
	import type { ComponentType } from 'svelte';
	import { X } from 'lucide-svelte';

	type InfoBoxVariant = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

	interface Props {
		variant?: InfoBoxVariant;
		icon?: ComponentType;
		dismissible?: boolean;
		onDismiss?: () => void;
		class?: string;
	}

	let {
		variant = 'info',
		icon: Icon,
		dismissible = false,
		onDismiss,
		class: className,
		children
	}: Props = $props();

	function handleDismiss() {
		if (dismissible && onDismiss) {
			onDismiss();
		}
	}
</script>

<div class="info-box info-box-{variant} {className}">
	{#if Icon}
		<div class="info-box-icon">
			<Icon size={18} />
		</div>
	{/if}
	<div class="info-box-content">
		{@render children?.()}
	</div>
	{#if dismissible}
		<button class="info-box-dismiss" onclick={handleDismiss} aria-label="Dismiss">
			<X size={16} />
		</button>
	{/if}
</div>

<style>
	.info-box {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		border: 1px solid;
		font-size: 0.875rem;
		align-items: flex-start;
	}

	.info-box-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding-top: 0.125rem; /* Slight top alignment adjustment */
	}

	.info-box-content {
		flex: 1;
		line-height: 1.5;
	}

	.info-box-content :global(strong) {
		font-weight: 600;
	}

	.info-box-dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: 4px;
		opacity: 0.7;
		transition: all 0.15s ease;
	}

	.info-box-dismiss:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.05);
	}

	/* Info variant - Blue */
	.info-box-info {
		background: rgba(59, 130, 246, 0.08);
		border-color: rgba(59, 130, 246, 0.3);
	}

	.info-box-info .info-box-icon :global(svg) {
		color: #2563eb;
	}

	.info-box-info .info-box-content {
		color: #1e40af;
	}

	.info-box-info .info-box-content :global(strong) {
		color: #1e3a8a;
	}

	/* Warning variant - Amber/Yellow */
	.info-box-warning {
		background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
		border-color: #fbbf24;
	}

	.info-box-warning .info-box-icon :global(svg) {
		color: #d97706;
	}

	.info-box-warning .info-box-content {
		color: #78350f;
	}

	.info-box-warning .info-box-content :global(strong) {
		color: #92400e;
	}

	/* Success variant - Green */
	.info-box-success {
		background: rgba(34, 197, 94, 0.08);
		border-color: rgba(34, 197, 94, 0.3);
	}

	.info-box-success .info-box-icon :global(svg) {
		color: #16a34a;
	}

	.info-box-success .info-box-content {
		color: #166534;
	}

	.info-box-success .info-box-content :global(strong) {
		color: #14532d;
	}

	/* Danger variant - Red */
	.info-box-danger {
		background: rgba(239, 68, 68, 0.08);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.info-box-danger .info-box-icon :global(svg) {
		color: #dc2626;
	}

	.info-box-danger .info-box-content {
		color: #991b1b;
	}

	.info-box-danger .info-box-content :global(strong) {
		color: #7f1d1d;
	}

	/* Neutral variant - Gray */
	.info-box-neutral {
		background: rgba(148, 163, 184, 0.08);
		border-color: rgba(148, 163, 184, 0.3);
	}

	.info-box-neutral .info-box-icon :global(svg) {
		color: #64748b;
	}

	.info-box-neutral .info-box-content {
		color: #475569;
	}

	.info-box-neutral .info-box-content :global(strong) {
		color: #334155;
	}
</style>
