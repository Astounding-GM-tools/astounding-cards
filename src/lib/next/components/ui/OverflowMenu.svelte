<script lang="ts">
	import type { ComponentType } from 'svelte';

	interface MenuItem {
		label: string;
		icon?: ComponentType | string;
		onClick: () => void;
		disabled?: boolean;
	}

	interface Props {
		items: MenuItem[];
		label?: string;
	}

	let { items, label = '•••' }: Props = $props();

	let isOpen = $state(false);

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function handleItemClick(item: MenuItem) {
		if (!item.disabled) {
			item.onClick();
			isOpen = false;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.overflow-menu-container')) {
			isOpen = false;
		}
	}
</script>

<div class="overflow-menu-container">
	<button class="overflow-menu-button" onclick={toggleMenu} aria-label="More actions">
		{label}
	</button>

	{#if isOpen}
		<div class="overflow-menu">
			{#each items as item}
				<button
					class="overflow-menu-item"
					onclick={() => handleItemClick(item)}
					disabled={item.disabled}
				>
					{#if item.icon}
						<span class="menu-icon">
							{#if typeof item.icon === 'string'}
								{item.icon}
							{:else}
								{@const IconComponent = item.icon}
								<IconComponent size={16} />
							{/if}
						</span>
					{/if}
					<span class="menu-label">{item.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<svelte:window onclick={handleClickOutside} />

<style>
	.overflow-menu-container {
		position: relative;
	}

	.overflow-menu-button {
		padding: 0.75rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.overflow-menu-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.overflow-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 200px;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 100;
	}

	.overflow-menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--ui-text, #1a202c);
		transition: background 0.2s;
	}

	.overflow-menu-item:hover:not(:disabled) {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.overflow-menu-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.menu-icon {
		font-size: 1rem;
	}

	.menu-label {
		flex: 1;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.overflow-menu-button {
			padding: 0.5rem 0.75rem;
			font-size: 0.875rem;
		}
	}
</style>
