<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';

	interface DropdownOption {
		value: string;
		label: string;
	}

	interface Props {
		label?: string;
		value?: string;
		options: DropdownOption[];
		onChange?: (value: string) => void;
		disabled?: boolean;
		size?: 'sm' | 'md';
	}

	let {
		label,
		value,
		options,
		onChange,
		disabled = false,
		size = 'md'
	}: Props = $props();

	let isOpen = $state(false);

	function toggle() {
		if (!disabled) {
			isOpen = !isOpen;
		}
	}

	function select(optionValue: string) {
		onChange?.(optionValue);
		isOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.dropdown-container')) {
			isOpen = false;
		}
	}

	// Get the label for the selected value
	let selectedLabel = $derived(
		options.find(opt => opt.value === value)?.label || options[0]?.label || ''
	);
</script>

<div class="dropdown-container">
	<button
		class="dropdown-button"
		class:size-sm={size === 'sm'}
		class:size-md={size === 'md'}
		onclick={toggle}
		{disabled}
		type="button"
	>
		{#if label}
			<span class="dropdown-label">{label}:</span>
		{/if}
		<span class="dropdown-value">{selectedLabel}</span>
		<ChevronDown size={size === 'sm' ? 12 : 14} />
	</button>

	{#if isOpen && !disabled}
		<div class="dropdown-menu">
			{#each options as option}
				<button
					class="dropdown-item"
					class:active={value === option.value}
					onclick={() => select(option.value)}
					type="button"
				>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<svelte:window onclick={handleClickOutside} />

<style>
	.dropdown-container {
		position: relative;
		display: inline-block;
	}

	.dropdown-button {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.dropdown-button.size-sm {
		padding: 0.125rem 0.375rem;
		font-size: 0.8125rem;
		gap: 0.25rem;
	}

	.dropdown-button:hover:not(:disabled) {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.dropdown-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.dropdown-label {
		color: var(--ui-muted, #64748b);
		font-weight: 400;
	}

	.dropdown-value {
		font-weight: 500;
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		min-width: 150px;
		max-width: 250px;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		z-index: 50;
		overflow: hidden;
	}

	.dropdown-item {
		width: 100%;
		display: block;
		padding: 0.5rem 0.75rem;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--ui-text, #1a202c);
		transition: background 0.2s;
	}

	.dropdown-item:hover {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.dropdown-item.active {
		background: var(--ui-hover-bg, #f8fafc);
		font-weight: 500;
		color: var(--button-primary-bg, #3b82f6);
	}
</style>
