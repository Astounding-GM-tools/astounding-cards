<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { AlertVariant } from '$lib/next/types/ui';
	import { X } from 'lucide-svelte';

	interface Props {
		variant?: AlertVariant;
		icon?: Snippet;
		dismissible?: boolean;
		onDismiss?: () => void;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'info',
		icon,
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
	{#if icon}
		<div class="info-box-icon">
			{@render icon()}
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

	/* Info variant */
	.info-box-info {
		background: var(--alert-info-bg);
		border-color: var(--alert-info-border);
	}

	.info-box-info .info-box-icon :global(svg) {
		color: var(--alert-info);
	}

	.info-box-info .info-box-content {
		color: var(--alert-info-text);
	}

	.info-box-info .info-box-content :global(strong) {
		color: var(--alert-info-text-strong);
	}

	/* Warning variant */
	.info-box-warning {
		background: var(--alert-warning-bg);
		border-color: var(--alert-warning-border);
	}

	.info-box-warning .info-box-icon :global(svg) {
		color: var(--alert-warning);
	}

	.info-box-warning .info-box-content {
		color: var(--alert-warning-text);
	}

	.info-box-warning .info-box-content :global(strong) {
		color: var(--alert-warning-text-strong);
	}

	/* Success variant */
	.info-box-success {
		background: var(--alert-success-bg);
		border-color: var(--alert-success-border);
	}

	.info-box-success .info-box-icon :global(svg) {
		color: var(--alert-success);
	}

	.info-box-success .info-box-content {
		color: var(--alert-success-text);
	}

	.info-box-success .info-box-content :global(strong) {
		color: var(--alert-success-text-strong);
	}

	/* Danger variant */
	.info-box-danger {
		background: var(--alert-danger-bg);
		border-color: var(--alert-danger-border);
	}

	.info-box-danger .info-box-icon :global(svg) {
		color: var(--alert-danger);
	}

	.info-box-danger .info-box-content {
		color: var(--alert-danger-text);
	}

	.info-box-danger .info-box-content :global(strong) {
		color: var(--alert-danger-text-strong);
	}

	/* Neutral variant */
	.info-box-neutral {
		background: var(--alert-neutral-bg);
		border-color: var(--alert-neutral-border);
	}

	.info-box-neutral .info-box-icon :global(svg) {
		color: var(--alert-neutral);
	}

	.info-box-neutral .info-box-content {
		color: var(--alert-neutral-text);
	}

	.info-box-neutral .info-box-content :global(strong) {
		color: var(--alert-neutral-text-strong);
	}
</style>
