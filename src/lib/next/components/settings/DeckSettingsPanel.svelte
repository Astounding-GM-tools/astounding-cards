<script lang="ts">
	import type { Deck, Layout, Preset } from '../../types/deck';
	import { nextDeckStore } from '../../stores/deckStore.svelte';
	import { toasts } from '$lib/stores/toast';

	interface Props {
		deck: Deck;
		isExpanded?: boolean;
	}

	let { deck, isExpanded = false }: Props = $props();

	// Local state bound to deck meta
	let layout = $state<Layout>(deck.meta.layout);
	let preset = $state<Preset>(deck.meta.preset || 'trading');

	// Update deck when settings change
	async function updateLayout(newLayout: Layout) {
		layout = newLayout;
		try {
			await nextDeckStore.updateDeckMeta({ layout: newLayout });
			toasts.success('Print size updated');
		} catch (err) {
			console.error('Failed to update layout:', err);
			toasts.error('Failed to update print size');
		}
	}

	async function updatePreset(newPreset: Preset) {
		preset = newPreset;
		try {
			await nextDeckStore.updateDeckMeta({ preset: newPreset });
			toasts.success('Preset updated');
		} catch (err) {
			console.error('Failed to update preset:', err);
			toasts.error('Failed to update preset');
		}
	}
</script>

{#if isExpanded}
	<div class="deck-settings-panel">
		<div class="settings-grid">
			<!-- Print Size -->
			<fieldset class="setting-group">
				<legend>Print Size</legend>
				<div class="options">
					<button
						class="option-button"
						class:active={layout === 'poker'}
						onclick={() => updateLayout('poker')}
					>
						<div class="preview preview-small">
							<div class="preview-grid">
								{#each Array(9) as _, i}
									<div class="preview-card"></div>
								{/each}
							</div>
						</div>
						<div class="option-text">
							<span class="option-label">Small</span>
							<span class="option-description">9 cards per page</span>
						</div>
					</button>

					<button
						class="option-button"
						class:active={layout === 'tarot'}
						onclick={() => updateLayout('tarot')}
					>
						<div class="preview preview-large">
							<div class="preview-grid">
								{#each Array(4) as _, i}
									<div class="preview-card"></div>
								{/each}
							</div>
						</div>
						<div class="option-text">
							<span class="option-label">Large</span>
							<span class="option-description">4 cards per page</span>
						</div>
					</button>
				</div>
			</fieldset>

			<!-- Preset -->
			<fieldset class="setting-group">
				<legend>Preset</legend>
				<div class="options">
					<button
						class="option-button"
						class:active={preset === 'minimal'}
						onclick={() => updatePreset('minimal')}
					>
						<div class="option-text">
							<span class="option-label">Minimal</span>
							<span class="option-description">Clean & simple</span>
						</div>
					</button>

					<button
						class="option-button"
						class:active={preset === 'trading'}
						onclick={() => updatePreset('trading')}
					>
						<div class="option-text">
							<span class="option-label">Trading Card</span>
							<span class="option-description">Detailed profile</span>
						</div>
					</button>
				</div>
			</fieldset>
		</div>
	</div>
{/if}

<style>
	.deck-settings-panel {
		padding: 1.5rem;
		background: var(--ui-bg-secondary, #f8fafc);
		border-top: 1px solid var(--ui-border, #e2e8f0);
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.setting-group {
		border: none;
		padding: 0;
		margin: 0;
	}

	legend {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ui-muted, #64748b);
		margin-bottom: 0.75rem;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-button {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: white;
		border: 2px solid var(--ui-border, #e2e8f0);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font: inherit;
		text-align: left;
		width: 100%;
	}

	.option-button:hover {
		border-color: var(--ui-text, #1e293b);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.option-button.active {
		border-color: var(--primary, #3b82f6);
		background: var(--primary-light, #eff6ff);
		box-shadow: 0 0 0 1px var(--primary, #3b82f6);
	}

	.option-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.option-label {
		font-weight: 600;
		font-size: 1rem;
		color: var(--ui-text, #1e293b);
	}

	.option-description {
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
	}

	/* Preview visualizations */
	.preview {
		flex-shrink: 0;
		width: 60px;
		height: 80px;
		background: white;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 0.25rem;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-grid {
		width: 100%;
		height: 100%;
		display: grid;
		gap: 2px;
	}

	.preview-small .preview-grid {
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
	}

	.preview-large .preview-grid {
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
	}

	.preview-card {
		background: var(--ui-muted, #64748b);
		border-radius: 1px;
		opacity: 0.3;
	}

	.option-button.active .preview-card {
		background: var(--primary, #3b82f6);
		opacity: 0.6;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.deck-settings-panel {
			padding: 1rem;
		}

		.settings-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.option-button {
			padding: 0.75rem;
		}

		.preview {
			width: 50px;
			height: 70px;
		}
	}
</style>
