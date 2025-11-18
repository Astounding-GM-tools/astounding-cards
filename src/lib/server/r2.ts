/**
 * Cloudflare R2 Client
 *
 * S3-compatible client for uploading images to Cloudflare R2 storage
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
	R2_ACCOUNT_ID,
	R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY,
	R2_BUCKET_NAME
} from '$env/static/private';
import { PUBLIC_R2_PATH_PREFIX } from '$env/static/public';

// Validate environment variables
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
	throw new Error('Missing required R2 environment variables');
}

const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Create S3 client configured for R2
const r2Client = new S3Client({
	region: 'auto',
	endpoint: R2_ENDPOINT,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});

/**
 * Upload an image to R2
 *
 * @param imageData - Image as Buffer or Uint8Array
 * @param fileName - Name for the file (e.g., "card-abc123.png")
 * @param contentType - MIME type (e.g., "image/png")
 * @returns Public URL to access the image
 */
export async function uploadImage(
	imageData: Buffer | Uint8Array,
	fileName: string,
	contentType: string
): Promise<string> {
	// Construct path: dev/cards/filename.png or prod/cards/filename.png
	const pathPrefix = PUBLIC_R2_PATH_PREFIX || 'dev';
	const key = `${pathPrefix}/cards/${fileName}`;

	try {
		await r2Client.send(
			new PutObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: key,
				Body: imageData,
				ContentType: contentType
			})
		);

		// Return public URL (will configure custom domain later)
		// For now: https://pub-<id>.r2.dev/<key>
		// We'll return the key for now, full URL setup comes with custom domain
		return key;
	} catch (error) {
		console.error('R2 upload error:', error);
		throw new Error('Failed to upload image to R2');
	}
}

/**
 * Delete an image from R2
 *
 * @param key - The R2 key/path (e.g., "dev/cards/card-abc123.png")
 */
export async function deleteImage(key: string): Promise<void> {
	try {
		await r2Client.send(
			new DeleteObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: key
			})
		);
	} catch (error) {
		console.error('R2 delete error:', error);
		throw new Error('Failed to delete image from R2');
	}
}

/**
 * Generate a unique filename for an image
 *
 * @param cardId - The card ID
 * @param extension - File extension (e.g., "png", "jpg")
 * @returns Filename string
 */
export function generateImageFileName(cardId: string, extension: string): string {
	const timestamp = Date.now();
	return `${cardId}-${timestamp}.${extension}`;
}
