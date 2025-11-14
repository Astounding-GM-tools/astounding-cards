/**
 * Image Upload API Route
 *
 * POST /api/images/upload
 * Uploads an image to Cloudflare R2 and returns the URL
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadImage, generateImageFileName } from '$lib/server/r2';
import { R2_PUBLIC_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse form data
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const cardId = formData.get('cardId') as string;

		// Validate inputs
		if (!file) {
			return error(400, 'No file provided');
		}

		if (!cardId) {
			return error(400, 'No card ID provided');
		}

		// Validate file type
		const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
		if (!validTypes.includes(file.type)) {
			return error(400, 'Invalid file type. Only PNG, JPEG, and WebP are allowed.');
		}

		// Validate file size (max 5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return error(400, 'File too large. Maximum size is 5MB.');
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Generate filename
		const extension = file.type.split('/')[1];
		const fileName = generateImageFileName(cardId, extension);

		// Upload to R2
		const key = await uploadImage(buffer, fileName, file.type);

		// Construct full public URL
		const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : key;

		// Return success with the key and public URL
		return json({
			success: true,
			key,
			url: publicUrl,
			fileName,
			contentType: file.type,
			size: file.size
		});
	} catch (err) {
		console.error('Upload API error:', err);
		return error(500, 'Failed to upload image');
	}
};
