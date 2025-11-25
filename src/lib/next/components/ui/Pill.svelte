<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { AlertVariant } from '$lib/next/types/ui';

	interface Props {
		variant?: AlertVariant;
		size?: 'sm' | 'md';
		icon?: Snippet;
		title?: string;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'info', size = 'md', icon, title, class: className, children }: Props = $props();
</script>

<span class="pill pill-{variant} pill-{size} {className}" {title}>
	{#if icon}
		<span class="pill-icon">
			{@render icon()}
		</span>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</span>

<style>
	.pill {
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
	.pill-sm {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
	}

	.pill-md {
		font-size: 0.875rem;
		padding: 0.25rem 0.5rem;
	}

	.pill-icon {
		display: inline-flex;
		align-items: center;
		font-size: 1em;
	}

	/* AlertVariant: info - blue/gray */
	.pill-info {
		background: var(--info-bg, #dbeafe);
		color: var(--info-text, #1e40af);
	}

	/* AlertVariant: warning - orange */
	.pill-warning {
		background: var(--warning-bg, #fef3c7);
		color: var(--warning-text, #92400e);
	}

	/* AlertVariant: success - green */
	.pill-success {
		background: var(--success-bg, #d1fae5);
		color: var(--success-text, #065f46);
	}

	/* AlertVariant: danger - red */
	.pill-danger {
		background: var(--error-bg, #fee2e2);
		color: var(--error-text, #991b1b);
	}

	/* AlertVariant: neutral - transparent */
	.pill-neutral {
		background: transparent;
		color: currentColor;
		border: none;
		padding: 0;
	}
</style>
