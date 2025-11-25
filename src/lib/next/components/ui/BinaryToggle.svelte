<script lang="ts">
	interface Props {
		checked: boolean;
		onToggle: (checked: boolean) => void;
		trueLabel: string; // Label shown when checked (e.g., "🀜 Tarot")
		falseLabel: string; // Label shown when unchecked (e.g., "🀡 Poker")
		disabled?: boolean;
		name?: string;
		size?: 'sm' | 'md';
	}

	let {
		checked,
		onToggle,
		trueLabel,
		falseLabel,
		disabled = false,
		name = 'binary-toggle',
		size = 'sm'
	}: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onToggle(target.checked);
	}

	// Function to split label into symbol and text parts
	function splitLabel(label: string): string | { symbol: string; text: string } {
		// Split on first whitespace to separate potential symbol from text
		const spaceIndex = label.indexOf(' ');

		if (spaceIndex === -1) {
			// No space found, return entire label as string
			return label;
		}

		const firstPart = label.slice(0, spaceIndex);
		const restPart = label.slice(spaceIndex + 1);

		// Check if first part is not a regular ASCII letter (likely a symbol)
		const isFirstPartSymbol = !/^[A-Za-z]+$/.test(firstPart);

		if (isFirstPartSymbol) {
			return {
				symbol: firstPart,
				text: restPart
			};
		}

		// No symbol found, return entire label as string
		return label;
	}

	// Get split versions of both labels
	let trueLabelSplit = $derived(splitLabel(trueLabel));
	let falseLabelSplit = $derived(splitLabel(falseLabel));
	let currentLabelSplit = $derived(checked ? trueLabelSplit : falseLabelSplit);
</script>

<label
	class="binary-toggle"
	class:disabled
	class:size-sm={size === 'sm'}
	class:size-md={size === 'md'}
>
	<input type="checkbox" {name} {checked} onchange={handleChange} {disabled} />
	<div class="toggle-label">
		{#if typeof currentLabelSplit === 'string'}
			{currentLabelSplit}
		{:else}
			<span class="label-symbol">{currentLabelSplit.symbol}</span><span class="label-text"
				>{currentLabelSplit.text}</span
			>
		{/if}
	</div>
</label>

<style>
	.binary-toggle {
		display: flex;
		align-items: center;
		cursor: pointer;
		gap: 0.25rem;
		transition: all 0.2s;
		padding: 0.125rem 0.25rem;
		border-radius: 4px;
		user-select: none;
	}

	.binary-toggle.size-sm {
		font-size: 0.875rem;
	}

	.binary-toggle.size-md {
		font-size: 1rem;
	}

	.binary-toggle.disabled {
		opacity: 0.6;
		pointer-events: none;
		cursor: not-allowed;
	}

	.binary-toggle:hover:not(.disabled) {
		background: var(--ui-hover-bg, #f8fafc);
		transform: translateY(-1px);
	}

	.binary-toggle input[type='checkbox'] {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		border: none;
		outline: none;
		background: none;
		margin: 0;
		padding: 0;
	}

	.toggle-label {
		color: var(--ui-muted, #64748b);
		transition: all 0.2s;
		font-weight: 500;
		white-space: nowrap;
		min-width: 4rem;
	}

	.label-symbol {
		margin-right: 0.25rem;
		display: inline-block;
	}

	.label-text {
		display: inline-block;
	}

	.binary-toggle:hover:not(.disabled) .toggle-label {
		color: var(--ui-text, #1a202c);
	}

	.binary-toggle input[type='checkbox']:hover + .toggle-label {
		color: var(--button-primary-hover-bg, #2563eb);
	}

	/* Focus styles for accessibility */
	.binary-toggle input[type='checkbox']:focus + .toggle-label {
		outline: 2px solid var(--focus-ring, #3b82f6);
		outline-offset: 2px;
		border-radius: 2px;
	}
</style>
