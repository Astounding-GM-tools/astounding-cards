<script lang="ts">
	interface Props {
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
		size?: 'sm' | 'md';
		icon?: string;
		children?: any;
	}

	let {
		variant = 'default',
		size = 'md',
		icon,
		children
	}: Props = $props();
</script>

<span 
	class="badge"
	class:variant-default={variant === 'default'}
	class:variant-success={variant === 'success'}
	class:variant-warning={variant === 'warning'}
	class:variant-error={variant === 'error'}
	class:variant-info={variant === 'info'}
	class:variant-neutral={variant === 'neutral'}
	class:size-sm={size === 'sm'}
	class:size-md={size === 'md'}
>
	{#if icon}
		<span class="badge-icon">{icon}</span>
	{/if}
	{@render children?.()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 500;
		white-space: nowrap;
		line-height: 1.2;
	}

	/* Sizes */
	.badge.size-sm {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
	}

	.badge.size-md {
		font-size: 0.875rem;
		padding: 0.25rem 0.5rem;
	}

	/* Variants */
	.badge.variant-default {
		background: var(--ui-hover-bg, #f8fafc);
		color: var(--ui-text, #1a202c);
		border: 1px solid var(--ui-border, #e2e8f0);
	}

	.badge.variant-success {
		background: var(--success-bg, #d1fae5);
		color: var(--success-text, #065f46);
	}

	.badge.variant-warning {
		background: var(--warning-bg, #fef3c7);
		color: var(--warning-text, #92400e);
	}

	.badge.variant-error {
		background: var(--error-bg, #fee2e2);
		color: var(--error-text, #991b1b);
	}

	.badge.variant-info {
		background: var(--info-bg, #dbeafe);
		color: var(--info-text, #1e40af);
	}

	.badge.variant-neutral {
		background: transparent;
		color: var(--ui-muted, #64748b);
		border: none;
		padding: 0;
	}

	.badge-icon {
		display: inline-flex;
		align-items: center;
		font-size: 1em;
	}
</style>
