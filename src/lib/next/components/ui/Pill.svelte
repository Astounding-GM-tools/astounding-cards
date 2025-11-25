<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { AlertVariant } from '$lib/next/types/ui';

	// Pill-specific variants extend AlertVariant
	type PillVariant = AlertVariant | 'published' | 'mine' | 'community' | 'remix' | 'default';

	interface Props {
		variant?: PillVariant;
		icon?: Snippet;
		title?: string;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'default', icon, title, class: className, children }: Props = $props();
</script>

<span class="pill pill-{variant} {className}" {title}>
	{#if icon}
		{@render icon()}
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
		font-size: 0.875rem;
		white-space: nowrap;
	}

	/* Published - green */
	.pill-published {
		background: rgba(5, 150, 105, 0.1);
		color: #059669;
	}

	/* Warning - orange */
	.pill-warning {
		background: rgba(234, 88, 12, 0.1);
		color: #ea580c;
	}

	/* Mine - blue */
	.pill-mine {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	/* Community - purple */
	.pill-community {
		background: rgba(147, 51, 234, 0.1);
		color: #9333ea;
	}

	/* Remix - pink */
	.pill-remix {
		background: rgba(236, 72, 153, 0.1);
		color: #ec4899;
	}

	/* Info - gray/neutral */
	.pill-info {
		background: rgba(100, 116, 139, 0.1);
		color: #64748b;
	}

	/* Default - minimal styling */
	.pill-default {
		background: var(--ui-border, #e2e8f0);
		color: var(--ui-text, #1a202c);
	}
</style>
