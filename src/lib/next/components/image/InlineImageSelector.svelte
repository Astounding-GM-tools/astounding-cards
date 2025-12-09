<!--
  InlineImageSelector.svelte
  Compact inline image selector for embedding in forms
  No modal, no preview - just the selection controls
-->
<script lang="ts">
	import type { CardSize } from '$lib/types';
	import type { Card } from '$lib/next/types/card';
	import AuthGatedCtaButton from '$lib/next/components/cta/AuthGatedCtaButton.svelte';
	import { IMAGE_GENERATION_CTA } from '$lib/config/cta-configs';
	import {
		initializeImageSelectorState,
		updateUrlValue,
		handleFileChange,
		handleUrlLoad,
		handleSaveAction,
		isProcessing,
		hasError,
		hasPreview,
		cleanupPreviewUrl,
		type ImageSelectorState
	} from '$lib/components/ui/ImageSelector.svelte.ts';
	import { formatTime } from '$lib/next/utils/dateUtils.js';
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import SimilarImagesDialog from '../dialogs/SimilarImagesDialog.svelte';

	// Use $props() with destructuring to maintain reactivity
	let {
		cardSize = 'tarot' as CardSize,
		onImageChange,
		onRemoveImage,
		onGenerateImage,
		hasExistingImage,
		imageLocked,
		onToggleLock,
		existingImageInfo,
		card,
		currentStyle
	}: {
		cardSize?: CardSize;
		onImageChange?: (blob: Blob | null, sourceUrl?: string, originalFileName?: string) => void;
		onRemoveImage?: () => void;
		onGenerateImage?: () => void;
		hasExistingImage?: boolean;
		imageLocked?: boolean;
		onToggleLock?: (locked: boolean) => void;
		existingImageInfo?: {
			filename?: string;
			source?: string;
			timestamp?: Date | null;
			status?: string;
			message?: string | null;
		};
		card?: Card;
		currentStyle?: string;
	} = $props();

	// Debug: log when existingImageInfo changes
	$effect(() => {
		console.log('[InlineImageSelector] existingImageInfo updated:', existingImageInfo);
	});

	let fileInput: HTMLInputElement | undefined = $state(undefined);
	let urlInput: HTMLInputElement | undefined = $state(undefined);
	let imageState = $state(initializeImageSelectorState() as ImageSelectorState);
	let showSimilarImages = $state(false);

	function openSimilarImagesDialog() {
		if (!card) return;
		showSimilarImages = true;
	}

	function handleSimilarImageSelected(imageUrl: string, imageId: string, style: string) {
		if (!onImageChange) {
			console.error('InlineImageSelector: onImageChange is not defined!');
			return;
		}

		// For community images, we don't need to fetch the blob
		// The image is already hosted on R2, so just pass the URL
		// Pass null for blob, the URL, and a filename
		onImageChange(null, imageUrl, `community-${imageId}.png`);
		
		showSimilarImages = false;
	}

	async function handleFile(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;

		imageState = await handleFileChange(imageState, file, cardSize);

		// Auto-save when file is processed
		if (hasPreview(imageState) && !hasError(imageState) && onImageChange) {
			imageState = await handleSaveAction(imageState, {
				onSave: (blob, sourceUrl) => onImageChange(blob, sourceUrl, imageState.originalFileName),
				onClose: () => {}
			});
		}
	}

	async function handleUrl() {
		if (!imageState.urlValue) return;

		imageState = await handleUrlLoad(imageState, cardSize);

		// Auto-save when URL is loaded
		if (hasPreview(imageState) && !hasError(imageState) && onImageChange) {
			imageState = await handleSaveAction(imageState, {
				onSave: (blob, sourceUrl) => onImageChange(blob, sourceUrl, imageState.originalFileName),
				onClose: () => {}
			});
		}
	}

	function handleRemove() {
		if (onRemoveImage) {
			onRemoveImage();
		}
		// Clear the inputs
		if (fileInput) fileInput.value = '';
		if (urlInput) urlInput.value = '';
		imageState = initializeImageSelectorState();
	}

	// Helper functions
	function formatUploadTime(time: Date): string {
		return formatTime(time.getTime(), 'timeAgo', { compact: true });
	}

	function getErrorMessage(error: string): string {
		// Check for common CORS-related errors
		if (
			error.includes('CORS') ||
			error.includes('Failed to fetch') ||
			error.includes('network') ||
			error.includes('blocked')
		) {
			return 'Image blocked by website. Try downloading and uploading the file instead.';
		}

		// Check for other common errors
		if (error.includes('404') || error.includes('not found')) {
			return 'Image not found at URL';
		}

		if (error.includes('403') || error.includes('forbidden')) {
			return 'Access denied. Try downloading and uploading the file instead.';
		}

		// Return original error for other cases
		return error;
	}

	function getImageSource(): string {
		// Check if we have a URL in formData from parent component (for existing images)
		// or if current state has URL value, then it was downloaded
		if (imageState.urlValue || imageState.isFromUrl) {
			return 'downloaded';
		}
		return 'uploaded';
	}

	// Cleanup preview URL when component is destroyed
	$effect(() => {
		return () => {
			cleanupPreviewUrl(imageState.previewUrl);
		};
	});
</script>

<section class="inline-image-selector">
	<!-- Always show URL or File input -->
	<div class="compact-input-row">
		<input
			bind:this={urlInput}
			bind:value={imageState.urlValue}
			type="url"
			id="url-input"
			placeholder="Paste image URL..."
			oninput={(e) =>
				(imageState = updateUrlValue(imageState, (e.currentTarget as HTMLInputElement).value))}
			disabled={isProcessing(imageState)}
		/>
		<button
			onclick={handleUrl}
			disabled={isProcessing(imageState) || !imageState.urlValue}
			class="load-btn"
			type="button"
		>
			{isProcessing(imageState) ? '...' : 'Load Image'}
		</button>
		<span class="divider">or</span>
		<label class="file-btn">
			<input
				bind:this={fileInput}
				type="file"
				id="file-input"
				accept="image/*"
				onchange={handleFile}
				disabled={isProcessing(imageState)}
				hidden
			/>
			Choose File
		</label>
	</div>

	{#if !hasExistingImage && onGenerateImage}
		<!-- Generate Button (prominent when no image) -->
		<AuthGatedCtaButton config={IMAGE_GENERATION_CTA} onAuthenticatedClick={onGenerateImage} />
	{/if}

	<!-- Line 3: File info + Status -->
	{#if imageState.originalFileName || existingImageInfo || isProcessing(imageState) || hasError(imageState) || hasPreview(imageState)}
		<div class="info-status-line" class:no-image={existingImageInfo?.status === 'add-image'}>
			<div class="file-info">
				{#if imageState.originalFileName}
					<span class="file-name">{imageState.originalFileName}</span>
					{#if imageState.uploadTime}
						<span class="upload-time">
							{getImageSource()}
							{formatUploadTime(imageState.uploadTime)}
						</span>
					{/if}
				{:else if existingImageInfo}
					<span class="file-name" class:encouraging={existingImageInfo.status === 'add-image'}>
						{existingImageInfo.filename || 'Existing image'}
					</span>
					{#if existingImageInfo.timestamp}
						<span class="upload-time">
							{existingImageInfo.source || 'uploaded'}
							{formatUploadTime(existingImageInfo.timestamp)}
						</span>
					{:else if existingImageInfo.message}
						<span class="encouraging-message">
							{existingImageInfo.message}
						</span>
					{/if}
				{/if}
			</div>

			<div class="status-actions">
				{#if isProcessing(imageState)}
					<span class="status processing">Processing...</span>
				{:else if hasError(imageState)}
					<span class="status error">{getErrorMessage(imageState.errorMessage || 'Error')}</span>
				{:else if existingImageInfo?.status === 'add-image'}
					<span class="status encouraging">Add an image</span>
				{:else if existingImageInfo?.status === 'ready-to-save'}
					<span class="status warning">Ready to save</span>
				{:else if hasPreview(imageState) || existingImageInfo?.status === 'ok' || existingImageInfo?.status === 'ready'}
					<span class="status success">✓</span>
				{/if}

				{#if hasExistingImage && onToggleLock}
					<label class="lock-checkbox">
						<input
							type="checkbox"
							checked={imageLocked}
							onchange={(e) => onToggleLock?.((e.currentTarget as HTMLInputElement).checked)}
						/>
						<span>🔒</span>
					</label>
				{/if}

				{#if hasExistingImage}
					<button type="button" class="unset-btn" onclick={handleRemove}> Unset </button>
				{/if}
			</div>
		</div>
	{/if}
</section>

{#if showSimilarImages && card}
	<div class="similar-images-overlay">
		<button
			type="button"
			class="overlay-backdrop"
			onclick={() => (showSimilarImages = false)}
			aria-label="Close similar images dialog"
		></button>
		<div class="overlay-content">
			<SimilarImagesDialog
				{card}
				{currentStyle}
				onImageSelected={handleSimilarImageSelected}
				onClose={() => (showSimilarImages = false)}
			/>
		</div>
	</div>
{/if}

<style>
	.inline-image-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Compact single row for URL/File input */
	.compact-input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.compact-input-row input[type='url'] {
		flex: 1;
		min-width: 0;
	}

	.divider {
		font-size: 0.75rem;
		color: #999;
		font-style: italic;
		padding: 0 0.25rem;
	}

	input[type='url'] {
		padding: 0.375rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		font-family: var(--font-body);
		font-size: 0.85rem;
	}

	input[type='url']:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 2px rgba(74, 85, 104, 0.1);
	}

	input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.file-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		background: var(--accent);
		color: white;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.8rem;
		white-space: nowrap;
		transition: opacity 0.2s;
		display: inline-block;
	}

	.file-btn:hover {
		opacity: 0.9;
	}

	.file-btn input:disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.load-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		background: var(--accent);
		color: white;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.load-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.load-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	/* CTA button spacing */
	:global(.inline-image-selector .cta-btn) {
		margin-top: 0.5rem;
	}

	.lock-checkbox {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		background: rgba(234, 179, 8, 0.1);
		border: 1px solid rgba(234, 179, 8, 0.2);
		cursor: pointer;
		transition: all 0.2s;
	}

	.lock-checkbox:hover {
		background: rgba(234, 179, 8, 0.15);
		border-color: rgba(234, 179, 8, 0.3);
	}

	.lock-checkbox input[type='checkbox'] {
		width: 0.875rem;
		height: 0.875rem;
		cursor: pointer;
		margin: 0;
	}

	.lock-checkbox span {
		font-size: 0.875rem;
		line-height: 1;
	}

	/* Line 3: Info and status line */
	.info-status-line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 3px;
		min-height: 2.5rem;
	}

	.file-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.file-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.upload-time {
		font-size: 0.75rem;
		color: #666;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.encouraging-message {
		font-size: 0.75rem;
		color: #856404;
		font-style: italic;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-name.encouraging {
		color: #856404;
		font-weight: 500;
	}

	.info-status-line.no-image {
		background: #fff9e6;
		border-color: #ffd700;
	}

	.status-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.status {
		font-size: 0.8rem;
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		white-space: nowrap;
	}

	.status.processing {
		background: #e3f2fd;
		color: #1976d2;
	}

	.status.error {
		background: #ffebee;
		color: #d32f2f;
		max-width: 20rem;
		white-space: normal;
		word-break: break-word;
	}

	.status.success {
		background: #e8f5e8;
		color: #2e7d32;
	}

	.status.encouraging {
		background: #fff3cd;
		color: #856404;
	}

	.status.warning {
		background: #fff3cd;
		color: #856404;
	}


	.unset-btn {
		padding: 0.25rem 0.5rem;
		border: 1px solid #cbd5e0;
		border-radius: 3px;
		background: #f7fafc;
		color: #4a5568;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.75rem;
		white-space: nowrap;
		transition: all 0.2s;
	}

	.unset-btn:hover {
		background: #edf2f7;
		border-color: #a0aec0;
	}

	.browse-similar-btn {
		width: 100%;
		padding: 0.75rem 1rem;
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 0.5rem;
	}

	.browse-similar-btn:hover {
		background: linear-gradient(135deg, #047857 0%, #065f46 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.compact-input-row {
			flex-wrap: wrap;
		}

		.info-status-line {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.status-actions {
			flex-direction: column;
			gap: 0.5rem;
			align-items: stretch;
		}

		.status.error {
			max-width: none;
		}
	}

	/* Overlay Styles */
	.similar-images-overlay {
		position: fixed;
		inset: 0;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.overlay-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
	}

	.overlay-content {
		position: relative;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		width: 100%;
		max-width: 800px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
	}
</style>
