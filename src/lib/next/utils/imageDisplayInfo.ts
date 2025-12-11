import type { Card } from '../types/card.js';

/**
 * Image display information for UI
 */
export interface ImageDisplayInfo {
	filename: string;
	source: string;
	timestamp: Date | null;
	status: string;
	message: string | null;
}

/**
 * Extract filename from a URL
 */
export function getFilenameFromUrl(url?: string | null): string | null {
	if (!url) return null;
	try {
		const urlObj = new URL(url);
		const filename = urlObj.pathname.split('/').pop() || '';
		return filename.includes('.') ? filename : null;
	} catch {
		return null;
	}
}

/**
 * Compute image display information for card editing UI
 * Used to show filename, source, and status of the current image
 */
export function computeImageDisplayInfo(params: {
	formBlob: Blob | null;
	formUrl: string | null;
	formMetadata: Card['imageMetadata'] | null;
	cardImageBlob: Blob | null | undefined;
	cardImageUrl: string | null | undefined;
	cardMetadata: Card['imageMetadata'] | null | undefined;
	isFormInitialized: boolean;
}): ImageDisplayInfo {
	const {
		formBlob,
		formUrl,
		formMetadata,
		cardImageBlob,
		cardImageUrl,
		cardMetadata,
		isFormInitialized
	} = params;

	const hasCardImageData = !!(cardImageBlob || cardImageUrl);
	const hasFormImageData = !!(formBlob || formUrl);

	const hasImageChanges =
		isFormInitialized &&
		(formBlob !== (cardImageBlob || null) ||
			formUrl !== (cardImageUrl || null) ||
			JSON.stringify(formMetadata) !== JSON.stringify(cardMetadata || null));

	// No image at all
	if (!hasCardImageData && !hasFormImageData) {
		return {
			filename: 'No image added',
			source: '',
			timestamp: null,
			status: 'add-image',
			message: 'Add an image to enhance your card! 📸'
		};
	}

	// Determine which data to use (form changes take precedence)
	const imageMetadata = hasImageChanges ? formMetadata : cardMetadata;
	const imageUrl = hasImageChanges ? formUrl : cardImageUrl;
	const imageBlob = hasImageChanges ? formBlob : cardImageBlob;

	let filename = '';
	let source = '';
	let timestamp: Date | null = null;
	const status = 'ok'; // Always 'ok' since auto-save is fast (< 1 second)

	// Extract display info from metadata, URL, or blob
	if (imageMetadata?.originalName) {
		filename = imageMetadata.originalName;
		source = imageMetadata.source === 'url' ? 'downloaded' : 'uploaded';
		timestamp = new Date(imageMetadata.addedAt!);
	} else if (imageUrl) {
		const urlFilename = getFilenameFromUrl(imageUrl);
		filename = urlFilename || imageUrl.substring(0, 40) + '...';
		source = `Using: ${imageUrl}`;
		timestamp = null;
	} else if (imageBlob) {
		filename = 'Uploaded file';
		source = 'Using: local file';
		timestamp = null;
	}

	return {
		filename,
		source,
		timestamp,
		status,
		message: null
	};
}
