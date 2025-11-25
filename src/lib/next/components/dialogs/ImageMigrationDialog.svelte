<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import { toasts } from '$lib/stores/toast.js';
	import type { Deck } from '$lib/next/types/deck.js';
	import type { Card } from '$lib/next/types/card.js';

	interface Props {
		deck: Deck;
		onMigrationComplete?: (migrationData: Record<string, { url: string; metadata: any }>) => void;
	}

	const { deck, onMigrationComplete }: Props = $props();

	interface ImageMigrationItem {
		card: Card;
		currentUrl?: string;
		newUrl?: string;
		isValidating?: boolean;
		isValid?: boolean;
		validationError?: string;
		previewUrl?: string; // For blob preview
	}

	// Local state
	let currentStep = $state(0);
	let migrationItems = $state<ImageMigrationItem[]>([]);
	let isBulkValidating = $state(false);
	let allValidated = $state(false);

	// Initialize migration items directly (no reactive effect needed)
	migrationItems = deck.cards
		.filter((card) => {
			// Skip cards with no images entirely (they're fine as-is)
			if (!card.image && !card.imageBlob) {
				return false; // Card has no image, no migration needed
			}

			// If card has a valid external URL, it's already shareable - no migration needed
			// even if it also has a blob (the URL takes precedence for sharing)
			if (card.image && isValidExternalUrl(card.image)) {
				return false; // Valid external URL exists, skip migration
			}

			// Need migration if:
			// 1. Has blob but no valid external URL
			// 2. Has image URL that's not a valid external URL
			return card.imageBlob || (card.image && !isValidExternalUrl(card.image));
		})
		.map((card) => ({
			card,
			currentUrl: card.image || undefined,
			previewUrl: card.imageBlob ? URL.createObjectURL(card.imageBlob) : card.image || undefined
		}));

	// Check if no items need migration and close dialog if so
	$effect(() => {
		if (migrationItems.length === 0) {
			toasts.info('All images are already using valid external URLs or cards have no images.');
			dialogStore.close();
		}
	});

	let currentItem = $derived(migrationItems[currentStep]);
	let totalItems = $derived(migrationItems.length);
	let canProceedToNext = $derived(currentItem?.isValid === true);
	let canComplete = $derived(allValidated && migrationItems.every((item) => item.isValid));

	function isValidExternalUrl(url?: string | null): boolean {
		if (!url) return false;
		try {
			const parsedUrl = new URL(url);
			return (
				(parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
				parsedUrl.hostname !== 'localhost' &&
				parsedUrl.hostname !== '127.0.0.1' &&
				!parsedUrl.protocol.startsWith('blob:') &&
				!parsedUrl.protocol.startsWith('data:')
			);
		} catch {
			return false;
		}
	}

	function setCurrentUrl(url: string) {
		if (currentItem) {
			currentItem.newUrl = url.trim();
			currentItem.isValid = undefined;
			currentItem.validationError = undefined;
		}
	}

	async function validateCurrentUrl() {
		if (!currentItem || !currentItem.newUrl) {
			if (currentItem) {
				currentItem.isValid = false;
				currentItem.validationError = 'Please enter a URL';
			}
			return;
		}

		currentItem.isValidating = true;
		currentItem.validationError = undefined;

		try {
			// Basic URL validation
			if (!isValidExternalUrl(currentItem.newUrl)) {
				currentItem.isValid = false;
				currentItem.validationError = 'Please enter a valid external URL (http:// or https://)';
				return;
			}

			toasts.info(`Loading image for "${currentItem.card.title}"...`);

			// Method 1: Try to actually load the image using Image() constructor
			// This is the most reliable way as it mimics exactly how browsers load images
			const isImageLoadable = await testImageLoad(currentItem.newUrl);

			if (isImageLoadable) {
				currentItem.isValid = true;
				toasts.success(`✅ Image successfully loaded for "${currentItem.card.title}"`);
				return;
			}

			// Method 2: If Image() fails, try fetch as fallback
			// Some edge cases might work with fetch but not Image() constructor
			toasts.info(`Trying alternative validation for "${currentItem.card.title}"...`);

			const response = await fetch(currentItem.newUrl, {
				method: 'GET',
				mode: 'cors', // Be explicit about CORS
				headers: {
					Accept: 'image/*,*/*;q=0.8' // Indicate we want images
				}
			});

			if (response.ok) {
				const contentType = response.headers.get('content-type');
				if (contentType && contentType.startsWith('image/')) {
					// Try to verify it's actually image data
					const blob = await response.blob();
					if (blob.type.startsWith('image/')) {
						currentItem.isValid = true;
						toasts.success(`✅ Image verified for "${currentItem.card.title}" (via fetch)`);
					} else {
						currentItem.isValid = false;
						currentItem.validationError = 'URL returned non-image content';
						toasts.error('URL does not contain image data');
					}
				} else {
					currentItem.isValid = false;
					currentItem.validationError = 'URL does not point to an image file';
					toasts.error('Server reports non-image content type');
				}
			} else {
				currentItem.isValid = false;
				currentItem.validationError = `HTTP ${response.status}: ${response.statusText}`;
				toasts.error(`Image URL not accessible: ${response.status} ${response.statusText}`);
			}
		} catch (err) {
			currentItem.isValid = false;
			if (err instanceof TypeError && err.message.includes('CORS')) {
				currentItem.validationError =
					'CORS policy blocks image access - image may not work in shared decks';
				toasts.error('CORS policy prevents image loading - this may cause issues when sharing');
			} else if (err instanceof TypeError && err.message.includes('network')) {
				currentItem.validationError = 'Network error - check your connection and URL';
				toasts.error('Network error while validating image');
			} else {
				currentItem.validationError = err instanceof Error ? err.message : 'Failed to load image';
				toasts.error(`Failed to validate image: ${currentItem.validationError}`);
			}
		} finally {
			currentItem.isValidating = false;
		}
	}

	// Test if image can actually be loaded by the browser
	function testImageLoad(url: string): Promise<boolean> {
		return new Promise((resolve) => {
			const img = new Image();

			// Set up success handler
			img.onload = () => {
				// Additional check: make sure image has actual dimensions
				if (img.naturalWidth > 0 && img.naturalHeight > 0) {
					resolve(true);
				} else {
					resolve(false);
				}
			};

			// Set up error handler
			img.onerror = () => {
				resolve(false);
			};

			// Set timeout to prevent hanging
			const timeout = setTimeout(() => {
				resolve(false);
			}, 10000); // 10 second timeout

			// Clean up timeout on success/error
			const cleanup = () => {
				clearTimeout(timeout);
			};
			img.onload = () => {
				cleanup();
				if (img.naturalWidth > 0 && img.naturalHeight > 0) {
					resolve(true);
				} else {
					resolve(false);
				}
			};
			img.onerror = () => {
				cleanup();
				resolve(false);
			};

			// Start loading - this will respect CORS, authentication, etc.
			// exactly like how the browser would load the image in an <img> tag
			img.crossOrigin = 'anonymous'; // Try to load with CORS
			img.src = url;
		});
	}

	function goToNext() {
		if (currentStep < totalItems - 1) {
			currentStep++;
		} else {
			// All items completed, check if we can finish
			allValidated = true;
		}
	}

	function goToPrevious() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function skipCurrent() {
		if (currentItem) {
			currentItem.isValid = false;
			currentItem.validationError = 'Skipped by user';
		}
		goToNext();
	}

	async function completeMigration() {

		try {
			const migrationData: Record<string, { url: string; metadata: any }> = {};

			for (const item of migrationItems) {
				if (item.isValid && item.newUrl) {
					// Update metadata to reflect the URL migration
					const updatedMetadata = {
						...item.card.imageMetadata,
						source: 'url' as const,
						addedAt: Date.now(),
						// Remove blob-specific metadata since we're now using URL
						size: undefined,
						originalName: undefined
					};

					migrationData[item.card.id] = {
						url: item.newUrl,
						metadata: updatedMetadata
					};
				}
			}


			const validCount = Object.keys(migrationData).length;

			if (validCount === 0) {
				toasts.error('No valid URLs to apply');
				return;
			}

			// Call the completion callback with both URLs and metadata
			onMigrationComplete?.(migrationData);

			toasts.success(
				`Image migration complete! ${validCount} image${validCount !== 1 ? 's' : ''} ready for sharing.`
			);
			dialogStore.close();
		} catch (err) {
			console.error('[ImageMigration] Error:', err);
			const errorMessage = err instanceof Error ? err.message : 'Failed to complete migration';
			toasts.error(`Migration failed: ${errorMessage}`);
		}
	}
</script>

<div class="image-migration-dialog">
	<div class="dialog-header">
		<h2>🖼️ Convert Images for Sharing</h2>
		<button class="close-button" onclick={() => dialogStore.close()}>×</button>
	</div>

	<div class="dialog-content">
		{#if totalItems > 0}
			<!-- Progress indicator -->
			<div class="migration-progress">
				<div class="progress-info">
					<h3>Image {currentStep + 1} of {totalItems}</h3>
					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: {((currentStep + (allValidated ? 1 : 0)) / totalItems) * 100}%"
						></div>
					</div>
				</div>
			</div>

			{#if !allValidated && currentItem}
				<!-- Current image step -->
				<div class="current-step">
					<div class="step-header">
						<h4>Card: "{currentItem.card.title}"</h4>
						<p>Please provide a publicly accessible URL for this image.</p>
					</div>

					<!-- Image comparison -->
					<div class="image-comparison">
						<!-- Current/Blob image -->
						<div class="image-preview-section">
							<h5>Current Image</h5>
							<div class="image-preview current">
								{#if currentItem.previewUrl}
									<img
										src={currentItem.previewUrl}
										alt="Current {currentItem.card.title}"
										class="preview-img"
									/>
								{:else}
									<div class="no-image">No Image</div>
								{/if}
							</div>
							<p class="image-source">
								{#if currentItem.card.imageBlob}
									📁 Local file
								{:else if currentItem.currentUrl}
									🔗 {currentItem.currentUrl.slice(0, 50)}...
								{:else}
									❌ No image
								{/if}
							</p>
						</div>

						<!-- Arrow -->
						<div class="arrow-section">
							<div class="arrow">→</div>
						</div>

						<!-- New URL preview -->
						<div class="image-preview-section">
							<h5>New URL Image</h5>
							<div class="image-preview new">
								{#if currentItem.newUrl && currentItem.isValid}
									<img
										src={currentItem.newUrl}
										alt="New {currentItem.card.title}"
										class="preview-img"
									/>
								{:else}
									<div class="placeholder">
										{#if currentItem.newUrl && currentItem.isValidating}
											🔄 Validating...
										{:else if currentItem.newUrl && currentItem.isValid === false}
											❌ Invalid URL
										{:else}
											📎 Enter URL below
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- URL input -->
					<div class="url-input-section">
						<label for="current-url">New Image URL:</label>
						<div class="url-input-group">
							<input
								id="current-url"
								type="url"
								placeholder="https://example.com/image.jpg"
								value={currentItem.newUrl || ''}
								oninput={(e) => setCurrentUrl((e.target as HTMLInputElement).value)}
								class="url-input"
								class:error={currentItem.isValid === false}
								class:success={currentItem.isValid === true}
								disabled={currentItem.isValidating}
							/>
							<button
								class="validate-button"
								onclick={validateCurrentUrl}
								disabled={!currentItem.newUrl || currentItem.isValidating}
							>
								{currentItem.isValidating ? '⏳' : '✓'}
							</button>
						</div>

						<!-- Validation status -->
						{#if currentItem.validationError}
							<div class="validation-error">⚠️ {currentItem.validationError}</div>
						{:else if currentItem.isValid === true}
							<div class="validation-success">✅ Valid image URL</div>
						{:else if currentItem.newUrl && !currentItem.isValidating}
							<div class="validation-pending">Press ✓ to validate URL</div>
						{/if}
					</div>

					<!-- Step actions -->
					<div class="step-actions">
						<button
							class="action-button secondary"
							onclick={goToPrevious}
							disabled={currentStep === 0}
						>
							← Previous
						</button>

						<button class="action-button secondary" onclick={skipCurrent}> Skip </button>

						<button class="action-button primary" onclick={goToNext} disabled={!canProceedToNext}>
							{currentStep === totalItems - 1 ? 'Finish' : 'Next →'}
						</button>
					</div>
				</div>
			{:else}
				<!-- All validated - summary -->
				<div class="migration-summary">
					<h3>✅ Migration Complete</h3>
					<p>All images have been processed. Review the results below:</p>

					<div class="summary-list">
						{#each migrationItems as item, index (item.card.id)}
							<div class="summary-item" class:invalid={!item.isValid}>
								<div class="summary-info">
									<strong>{item.card.title}</strong>
									{#if item.isValid && item.newUrl}
										<div class="summary-url">✅ {item.newUrl}</div>
									{:else}
										<div class="summary-error">❌ {item.validationError || 'Not validated'}</div>
									{/if}
								</div>
								<button
									class="edit-button"
									onclick={() => {
										currentStep = index;
										allValidated = false;
									}}
								>
									Edit
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Final actions -->
			<div class="migration-actions">
				<button class="action-button secondary" onclick={() => dialogStore.close()}>
					Cancel
				</button>

				{#if allValidated}
					<button class="action-button primary" onclick={completeMigration} disabled={!canComplete}>
						Apply Migration
					</button>
				{/if}
			</div>
		{:else}
			<div class="no-images">
				<h3>✅ No Migration Needed</h3>
				<p>All images are already using valid external URLs.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.image-migration-dialog {
		background: white;
		border-radius: 8px;
		max-width: 600px;
		width: 95vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		color: var(--ui-muted, #64748b);
		border-radius: 4px;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		color: var(--ui-text, #1a202c);
	}

	.dialog-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: var(--ui-border, #e2e8f0);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: var(--button-primary-bg, #3b82f6);
		transition: width 0.3s ease;
	}

	.preview-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.migration-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px solid var(--ui-border, #e2e8f0);
	}

	.action-button {
		padding: 0.75rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		background: var(--ui-bg, #ffffff);
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.action-button:hover:not(:disabled) {
		background: var(--ui-hover-bg, #f8fafc);
	}

	.action-button.primary {
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.action-button.primary:hover:not(:disabled) {
		background: var(--button-primary-hover-bg, #2563eb);
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.migration-progress {
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		padding-bottom: 1rem;
	}

	.progress-info h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		font-weight: 500;
		text-align: center;
	}

	.current-step {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.step-header h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.step-header p {
		margin: 0;
		color: var(--ui-muted, #64748b);
		font-size: 0.875rem;
	}

	.image-comparison {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--ui-hover-bg, #f8fafc);
		border-radius: 6px;
	}

	.image-preview-section {
		flex: 1;
		text-align: center;
	}

	.image-preview-section h5 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--ui-text, #1a202c);
	}

	.image-preview {
		width: 120px;
		height: 120px;
		border-radius: 8px;
		overflow: hidden;
		background: white;
		border: 2px solid var(--ui-border, #e2e8f0);
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 0.5rem auto;
	}

	.image-preview.current {
		border-color: var(--ui-muted, #64748b);
	}

	.image-preview.new {
		border-color: var(--button-primary-bg, #3b82f6);
	}

	.no-image,
	.placeholder {
		color: var(--ui-muted, #64748b);
		font-size: 0.875rem;
		text-align: center;
		padding: 1rem;
	}

	.image-source {
		margin: 0;
		font-size: 0.75rem;
		color: var(--ui-muted, #64748b);
		font-family: monospace;
		word-break: break-all;
	}

	.arrow-section {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.arrow {
		font-size: 2rem;
		color: var(--button-primary-bg, #3b82f6);
		font-weight: bold;
	}

	.url-input-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.url-input-section label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--ui-text, #1a202c);
	}

	.url-input-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.url-input {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		font-size: 0.875rem;
		font-family: monospace;
		transition: border-color 0.2s;
	}

	.url-input:focus {
		outline: none;
		border-color: var(--button-primary-bg, #3b82f6);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.url-input.error {
		border-color: var(--toast-error, #dc2626);
	}

	.url-input.success {
		border-color: var(--toast-success, #059669);
	}

	.validate-button {
		padding: 0.75rem;
		border: 2px solid var(--button-primary-bg, #3b82f6);
		border-radius: 6px;
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		font-size: 1rem;
		cursor: pointer;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.validate-button:hover:not(:disabled) {
		background: var(--button-primary-hover-bg, #2563eb);
		border-color: var(--button-primary-hover-bg, #2563eb);
	}

	.validate-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.validation-error {
		color: var(--toast-error, #dc2626);
		font-size: 0.875rem;
		padding: 0.5rem 0.75rem;
		background: rgba(220, 38, 38, 0.1);
		border-radius: 4px;
		border-left: 3px solid var(--toast-error, #dc2626);
	}

	.validation-success {
		color: var(--toast-success, #059669);
		font-size: 0.875rem;
		padding: 0.5rem 0.75rem;
		background: rgba(5, 150, 105, 0.1);
		border-radius: 4px;
		border-left: 3px solid var(--toast-success, #059669);
	}

	.validation-pending {
		color: var(--ui-muted, #64748b);
		font-size: 0.875rem;
		padding: 0.5rem 0.75rem;
		background: var(--ui-hover-bg, #f8fafc);
		border-radius: 4px;
		border-left: 3px solid var(--ui-muted, #64748b);
	}

	.step-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid var(--ui-border, #e2e8f0);
	}

	.migration-summary {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.migration-summary h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--toast-success, #059669);
	}

	.migration-summary p {
		margin: 0;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
	}

	.summary-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.summary-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		background: var(--ui-bg, white);
	}

	.summary-item.invalid {
		border-color: var(--toast-error, #dc2626);
		background: rgba(220, 38, 38, 0.05);
	}

	.summary-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.summary-url {
		font-size: 0.75rem;
		color: var(--toast-success, #059669);
		font-family: monospace;
		word-break: break-all;
	}

	.summary-error {
		font-size: 0.75rem;
		color: var(--toast-error, #dc2626);
	}

	.edit-button {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 4px;
		background: var(--ui-bg, white);
		color: var(--ui-text, #1a202c);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.edit-button:hover {
		background: var(--ui-hover-bg, #f8fafc);
		border-color: var(--button-primary-bg, #3b82f6);
		color: var(--button-primary-bg, #3b82f6);
	}

	.no-images {
		text-align: center;
		padding: 2rem;
	}

	.no-images h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--toast-success, #059669);
	}

	.no-images p {
		margin: 0;
		color: var(--ui-text, #1a202c);
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.image-comparison {
			flex-direction: column;
			gap: 1rem;
		}

		.arrow {
			transform: rotate(90deg);
		}

		.step-actions {
			flex-direction: column;
			gap: 0.5rem;
		}

		.step-actions .action-button {
			width: 100%;
		}

		.migration-actions {
			flex-direction: column;
		}

		.summary-item {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.summary-info {
			text-align: center;
		}
	}
</style>
