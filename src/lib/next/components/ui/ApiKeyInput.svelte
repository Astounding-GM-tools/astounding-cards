<script lang="ts">
	/**
	 * Reusable API Key Input Component
	 *
	 * Features:
	 * - API key validation
	 * - Integrated submit button that appears when key is valid
	 * - "Get API Key" link when key is invalid
	 * - Proper type="button" to prevent 1Password issues
	 * - Clean, compact styling
	 */

	interface Props {
		/** The current API key value */
		apiKey: string;
		/** Callback when API key changes */
		onApiKeyChange: (key: string) => void;
		/** Callback when submit button is clicked */
		onSubmit: () => void;
		/** Whether the submit action is currently processing */
		isProcessing?: boolean;
		/** Text for the submit button */
		submitButtonText?: string;
		/** Text for the submit button when processing */
		processingButtonText?: string;
		/** Placeholder text for the input */
		placeholder?: string;
		/** URL for getting the API key */
		getKeyUrl?: string;
		/** Text for the "Get API Key" link */
		getKeyText?: string;
	}

	const {
		apiKey,
		onApiKeyChange,
		onSubmit,
		isProcessing = false,
		submitButtonText = '🚀 Generate',
		processingButtonText = '🚀 Generating…',
		placeholder = 'Paste your API key here',
		getKeyUrl = 'https://aistudio.google.com/apikey',
		getKeyText = 'Get API Key →'
	} = $props();

	let apiKeyValid = $state(false);

	function validateApiKey() {
		// Basic validation - check if it looks like a Google API key
		const trimmedKey = apiKey.trim();
		apiKeyValid =
			trimmedKey.length > 20 && (trimmedKey.startsWith('AIza') || trimmedKey.includes('-'));
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		onApiKeyChange(target.value);
		validateApiKey();
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (apiKeyValid && !isProcessing) {
			onSubmit();
		}
	}

	// Validate whenever apiKey prop changes
	$effect(() => {
		validateApiKey();
	});
</script>

<form class="api-key-input-group" onsubmit={handleSubmit}>
	<input
		type="password"
		value={apiKey}
		oninput={handleInput}
		{placeholder}
		class="api-key-input"
		class:valid={apiKeyValid}
		autocomplete="current-password"
		name="apikey"
	/>
	{#if apiKeyValid}
		<button type="submit" class="submit-button-compact" disabled={isProcessing}>
			{isProcessing ? processingButtonText : submitButtonText}
		</button>
	{:else}
		<a href={getKeyUrl} target="_blank" class="get-key-link">
			{getKeyText}
		</a>
	{/if}
</form>

<style>
	.api-key-input-group {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.api-key-input {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		font-size: 0.875rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		transition: border-color 0.2s;
	}

	.api-key-input:focus {
		outline: none;
		border-color: var(--ui-purple, #7c3aed);
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}

	.api-key-input.valid {
		border-color: var(--ui-success, #059669);
		background-color: rgba(34, 197, 94, 0.05);
	}

	.get-key-link {
		padding: 0.75rem 1rem;
		background: var(--ui-purple, #7c3aed);
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.get-key-link:hover {
		background: #6d28d9;
		transform: translateY(-1px);
	}

	.submit-button-compact {
		padding: 0.75rem 1rem;
		border: 1px solid rgba(168, 85, 247, 0.3);
		border-radius: 6px;
		background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
		color: var(--ui-purple, #7c3aed);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
		white-space: nowrap;
	}

	.submit-button-compact:hover:not(:disabled) {
		background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
		border-color: rgba(168, 85, 247, 0.5);
		transform: translateY(-1px);
	}

	.submit-button-compact:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 768px) {
		.api-key-input-group {
			flex-direction: column;
			align-items: stretch;
		}

		.get-key-link {
			text-align: center;
		}
	}
</style>
