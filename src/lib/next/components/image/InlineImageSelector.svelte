<!--
  InlineImageSelector.svelte
  Compact inline image selector for embedding in forms
  No modal, no preview - just the selection controls
-->
<script lang="ts">
	import type { CardSize } from '$lib/types';
	import {
		initializeImageSelectorState,
		updateUrlValue,
		handleFileChange,
		handleUrlLoad,
		handleSaveAction,
		isProcessing,
		hasError,
		hasPreview,
		canSave,
		cleanupPreviewUrl,
		type ImageSelectorState
	} from '$lib/components/ui/ImageSelector.svelte.ts';
	import { formatTime } from '$lib/next/utils/dateUtils.js';

	const props = $props();
	const cardSize = (props.cardSize ?? 'tarot') as CardSize;
	const onImageChange = props.onImageChange as
		| ((blob: Blob | null, sourceUrl?: string, originalFileName?: string) => void)
		| undefined;
	const onRemoveImage = props.onRemoveImage as (() => void) | undefined;
	const onGenerateImage = props.onGenerateImage as (() => void) | undefined;
	const hasExistingImage = props.hasExistingImage as boolean | undefined;
	const imageLocked = props.imageLocked as boolean | undefined;
	const onToggleLock = props.onToggleLock as ((locked: boolean) => void) | undefined;
	const existingImageInfo = props.existingImageInfo as
		| {
				filename?: string;
				source?: string;
				timestamp?: Date | null;
				status?: string;
				message?: string | null;
		  }
		| undefined;

	let fileInput: HTMLInputElement;
	let urlInput: HTMLInputElement;
	let state = $state<ImageSelectorState>(initializeImageSelectorState());

	async function handleFile(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;

		state = await handleFileChange(state, file, cardSize);

		// Auto-save when file is processed
		if (hasPreview(state) && !hasError(state) && onImageChange) {
			state = await handleSaveAction(state, {
				onSave: (blob, sourceUrl) => onImageChange(blob, sourceUrl, state.originalFileName),
				onClose: () => {}
			});
		}
	}

	async function handleUrl() {
		if (!state.urlValue) return;

		state = await handleUrlLoad(state, cardSize);

		// Auto-save when URL is loaded
		if (hasPreview(state) && !hasError(state) && onImageChange) {
			state = await handleSaveAction(state, {
				onSave: (blob, sourceUrl) => onImageChange(blob, sourceUrl, state.originalFileName),
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
		state = initializeImageSelectorState();
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
		if (state.urlValue || state.isFromUrl) {
			return 'downloaded';
		}
		return 'uploaded';
	}

	// Cleanup preview URL when component is destroyed
	$effect(() => {
		return () => {
			cleanupPreviewUrl(state.previewUrl);
		};
	});
</script>

<div class="inline-image-selector">
	{#if !hasExistingImage}
		<!-- Single compact row: URL or File -->
		<div class="compact-input-row">
			<input
				bind:this={urlInput}
				bind:value={state.urlValue}
				type="url"
				id="url-input"
				placeholder="Paste image URL..."
				oninput={(e) =>
					(state = updateUrlValue(state, (e.currentTarget as HTMLInputElement).value))}
				disabled={isProcessing(state)}
			/>
			<button
				onclick={handleUrl}
				disabled={isProcessing(state) || !state.urlValue}
				class="load-btn"
				type="button"
			>
				{isProcessing(state) ? '...' : 'Load Image'}
			</button>
			<span class="divider">or</span>
			<label class="file-btn">
				<input
					bind:this={fileInput}
					type="file"
					id="file-input"
					accept="image/*"
					onchange={handleFile}
					disabled={isProcessing(state)}
					hidden
				/>
				Choose File
			</label>
		</div>

		<!-- Generate/Select Button (prominent when no image) -->
		{#if onGenerateImage}
			<button onclick={onGenerateImage} class="generate-select-btn" type="button">
				<span class="btn-icon">✨</span>
				<span class="btn-text">
					<strong>Generate or Select Image</strong>
					<small>AI generation & premium library</small>
				</span>
			</button>
		{/if}
	{/if}

	<!-- Line 3: File info + Status -->
	{#if state.originalFileName || existingImageInfo || isProcessing(state) || hasError(state) || hasPreview(state)}
		<div class="info-status-line" class:no-image={existingImageInfo?.status === 'add-image'}>
			<div class="file-info">
				{#if state.originalFileName}
					<span class="file-name">{state.originalFileName}</span>
					{#if state.uploadTime}
						<span class="upload-time">
							{getImageSource()}
							{formatUploadTime(state.uploadTime)}
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
				{#if isProcessing(state)}
					<div class="status processing">⏳ Loading image...</div>
				{:else if hasError(state)}
					<div class="status error">❌ {getErrorMessage(state.error)}</div>
				{:else if hasPreview(state)}
					<div class="status success">✅ Image ready</div>
				{:else if existingImageInfo?.status === 'add-image'}
					<div class="status encouraging">💡 Ready to add</div>
				{:else if existingImageInfo?.status === 'ready-to-save'}
					<div class="status warning">⚠️ Remember to save!</div>
				{:else if existingImageInfo?.status === 'ok'}
					<div class="status success">✅ Image OK</div>
				{:else if existingImageInfo?.status === 'ready'}
					<div class="status success">✅ Image ready</div>
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
					<button type="button" class="remove-btn" onclick={handleRemove}> Remove </button>
				{/if}
			</div>
		</div>
	{/if}
</div>

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
		title: "Lock image (prevent batch regeneration)";
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

	.remove-btn {
		padding: 0.25rem 0.5rem;
		border: 1px solid #fcc;
		border-radius: 3px;
		background: #fee;
		color: #c53030;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.75rem;
		white-space: nowrap;
	}

	.remove-btn:hover {
		background: #fed7d7;
		border-color: #fc8181;
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
</style>
