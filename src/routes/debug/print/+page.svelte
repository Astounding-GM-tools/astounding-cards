<script lang="ts">
	import PrintLayout from '$lib/next/components/print/PrintLayout.svelte';
	import type { Layout } from '$lib/next/types/deck';
	import type { Card } from '$lib/next/types/card';

	// Hard-coded sample cards for debugging
	const sampleCards: Card[] = Array.from({ length: 12 }, (_, i) => ({
		id: `card-${i + 1}`,
		title: `Card ${i + 1}`,
		subtitle: 'Debug Card',
		description: 'This is a sample card for print layout debugging.',
		traits: [
			{ title: 'Test Trait', description: 'A test trait', isPublic: true }
		],
		stats: [
			{ title: 'Power', value: 5, tracked: false, isPublic: true }
		],
		image: null,
		imageBlob: null
	}));

	let cards = $state(sampleCards);

	// Controls
	let layout = $state<Layout>('poker');
	let showCardBacks = $state(true);
	let showPrintStyles = $state(true); // Toggle to see print vs screen styles
</script>

<div class="debug-page">
	<div class="controls">
		<h1>🖨️ Print Layout Debug</h1>

		<div class="instructions">
			<strong>How to debug:</strong>
			<ol>
				<li><strong>Screen preview:</strong> Toggle "Show Print Styles" below to see crop marks</li>
				<li><strong>Actual print view:</strong> Press <kbd>Cmd+P</kbd> (Mac) or <kbd>Ctrl+P</kbd> (Windows) to see exact print output</li>
				<li>Set printer margins to <strong>"None"</strong> or <strong>"Minimum"</strong> for edge-to-edge printing</li>
			</ol>
		</div>

		<div class="control-group">
			<label>
				Layout:
				<select bind:value={layout}>
					<option value="poker">Poker (3x3)</option>
					<option value="tarot">Tarot (2x2)</option>
				</select>
			</label>

			<label>
				<input type="checkbox" bind:checked={showCardBacks} />
				Show Card Backs
			</label>

			<label>
				<input type="checkbox" bind:checked={showPrintStyles} />
				Show Print Styles (shows crop marks on screen)
			</label>
		</div>

		<p class="info">
			Cards: {cards.length} | Layout: {layout} ({layout === 'poker' ? '9' : '4'} per page) |
			<strong>Fluid sizing:</strong> Works with any paper size (A4, Letter, Legal, etc.)
		</p>
	</div>

	<div class="print-preview">
		<PrintLayout {cards} {layout} {showCardBacks} debugMode={showPrintStyles} />
	</div>
</div>

<style>
	.debug-page {
		min-height: 100vh;
		background: #f5f5f5;
	}

	.controls {
		position: sticky;
		top: 0;
		background: white;
		padding: 1rem 2rem;
		border-bottom: 2px solid #333;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		z-index: 100;
	}

	.controls h1 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
	}

	.instructions {
		background: #f0f9ff;
		border-left: 4px solid #3b82f6;
		padding: 1rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.instructions strong {
		font-size: 0.95rem;
		display: block;
		margin-bottom: 0.5rem;
	}

	.instructions ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.instructions li {
		margin-bottom: 0.5rem;
	}

	.instructions kbd {
		background: #334155;
		color: white;
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		font-family: monospace;
		font-size: 0.85rem;
	}

	.control-group {
		display: flex;
		gap: 2rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.control-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.control-group select {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.info {
		margin: 0;
		font-size: 0.875rem;
		color: #666;
	}

	.print-preview {
		padding: 2rem;
		background: #e0e0e0;
	}

	/* When showing print styles, adjust background */
	.print-preview :global(.print-layout.debug-mode) {
		background: white;
		padding: 0;
	}

	/* Hide controls when printing */
	@media print {
		.controls {
			display: none !important;
		}

		.print-preview {
			padding: 0;
			background: white;
		}
	}
</style>
