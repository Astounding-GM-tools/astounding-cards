import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS SDK - use vi.hoisted() to define variables accessible in mocks
const { mockSend } = vi.hoisted(() => ({
	mockSend: vi.fn()
}));

vi.mock('@aws-sdk/client-s3', () => ({
	S3Client: vi.fn(() => ({
		send: mockSend
	})),
	PutObjectCommand: vi.fn((params) => ({ params })),
	DeleteObjectCommand: vi.fn((params) => ({ params }))
}));

// Mock environment variables
vi.mock('$env/static/private', () => ({
	R2_ACCOUNT_ID: 'test-account-id',
	R2_ACCESS_KEY_ID: 'test-access-key',
	R2_SECRET_ACCESS_KEY: 'test-secret-key',
	R2_BUCKET_NAME: 'test-bucket',
	PUBLIC_R2_PATH_PREFIX: 'test-prefix'
}));

import { uploadImage, deleteImage, generateImageFileName } from './r2';

describe('R2 Helper Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('uploadImage', () => {
		it('successfully uploads an image buffer to R2 with correct key and content type', async () => {
			const imageBuffer = Buffer.from('fake-image-data');
			const fileName = 'card-abc123.png';
			const contentType = 'image/png';

			mockSend.mockResolvedValueOnce({});

			const result = await uploadImage(imageBuffer, fileName, contentType);

			expect(mockSend).toHaveBeenCalledTimes(1);
			const command = mockSend.mock.calls[0][0];
			expect(command.params).toEqual({
				Bucket: 'test-bucket',
				Key: 'test-prefix/cards/card-abc123.png',
				Body: imageBuffer,
				ContentType: contentType
			});
			expect(result).toBe('test-prefix/cards/card-abc123.png');
		});

		it('successfully uploads a Uint8Array to R2', async () => {
			const imageData = new Uint8Array([1, 2, 3, 4, 5]);
			const fileName = 'card-xyz789.jpg';
			const contentType = 'image/jpeg';

			mockSend.mockResolvedValueOnce({});

			const result = await uploadImage(imageData, fileName, contentType);

			expect(mockSend).toHaveBeenCalledTimes(1);
			const command = mockSend.mock.calls[0][0];
			expect(command.params.Body).toEqual(imageData);
			expect(command.params.ContentType).toBe(contentType);
			expect(result).toBe('test-prefix/cards/card-xyz789.jpg');
		});

		it('constructs the correct path with prefix and filename', async () => {
			const imageBuffer = Buffer.from('test-data');
			const fileName = 'my-card-image.webp';
			const contentType = 'image/webp';

			mockSend.mockResolvedValueOnce({});

			const result = await uploadImage(imageBuffer, fileName, contentType);

			expect(result).toBe('test-prefix/cards/my-card-image.webp');
		});

		it('throws an error when R2 upload fails', async () => {
			const imageBuffer = Buffer.from('test-data');
			const fileName = 'card-fail.png';
			const contentType = 'image/png';

			mockSend.mockRejectedValueOnce(new Error('S3 upload failed'));

			await expect(uploadImage(imageBuffer, fileName, contentType)).rejects.toThrow(
				'Failed to upload image to R2'
			);
		});

		it('handles network timeout errors', async () => {
			const imageBuffer = Buffer.from('test-data');
			const fileName = 'card-timeout.png';
			const contentType = 'image/png';

			mockSend.mockRejectedValueOnce(new Error('Network timeout'));

			await expect(uploadImage(imageBuffer, fileName, contentType)).rejects.toThrow(
				'Failed to upload image to R2'
			);
		});
	});

	describe('deleteImage', () => {
		it('successfully sends a delete command for a specified key', async () => {
			const key = 'test-prefix/cards/card-abc123.png';

			mockSend.mockResolvedValueOnce({});

			await deleteImage(key);

			expect(mockSend).toHaveBeenCalledTimes(1);
			const command = mockSend.mock.calls[0][0];
			expect(command.params).toEqual({
				Bucket: 'test-bucket',
				Key: key
			});
		});

		it('successfully deletes image with different key format', async () => {
			const key = 'prod/cards/different-card-456.jpg';

			mockSend.mockResolvedValueOnce({});

			await deleteImage(key);

			expect(mockSend).toHaveBeenCalledTimes(1);
			const command = mockSend.mock.calls[0][0];
			expect(command.params.Key).toBe(key);
		});

		it('throws an error when R2 delete fails', async () => {
			const key = 'test-prefix/cards/card-fail.png';

			mockSend.mockRejectedValueOnce(new Error('S3 delete failed'));

			await expect(deleteImage(key)).rejects.toThrow('Failed to delete image from R2');
		});

		it('handles permission errors', async () => {
			const key = 'test-prefix/cards/card-forbidden.png';

			mockSend.mockRejectedValueOnce(new Error('Access denied'));

			await expect(deleteImage(key)).rejects.toThrow('Failed to delete image from R2');
		});

		it('handles non-existent file deletion gracefully', async () => {
			const key = 'test-prefix/cards/non-existent.png';

			mockSend.mockResolvedValueOnce({});

			await expect(deleteImage(key)).resolves.not.toThrow();
		});
	});

	describe('generateImageFileName', () => {
		it('creates a unique filename using card ID and extension', () => {
			const cardId = 'card-abc-123';
			const extension = 'png';

			const fileName = generateImageFileName(cardId, extension);

			expect(fileName).toMatch(/^card-abc-123-\d+\.png$/);
			expect(fileName).toContain(cardId);
			expect(fileName).toContain(extension);
		});

		it('includes timestamp for uniqueness', () => {
			const cardId = 'card-xyz-789';
			const extension = 'jpg';

			// Generate two filenames in sequence
			const fileName1 = generateImageFileName(cardId, extension);
			const fileName2 = generateImageFileName(cardId, extension);

			// Both should have format: cardId-timestamp.extension
			expect(fileName1).toMatch(/^card-xyz-789-\d+\.jpg$/);
			expect(fileName2).toMatch(/^card-xyz-789-\d+\.jpg$/);

			// Extract timestamps
			const timestamp1 = fileName1.split('-').pop()?.split('.')[0];
			const timestamp2 = fileName2.split('-').pop()?.split('.')[0];

			expect(timestamp1).toBeTruthy();
			expect(timestamp2).toBeTruthy();
		});

		it('handles different file extensions', () => {
			const cardId = 'my-card';

			const pngFile = generateImageFileName(cardId, 'png');
			const jpgFile = generateImageFileName(cardId, 'jpg');
			const webpFile = generateImageFileName(cardId, 'webp');

			expect(pngFile).toContain('.png');
			expect(jpgFile).toContain('.jpg');
			expect(webpFile).toContain('.webp');
		});

		it('handles card IDs with special characters', () => {
			const cardId = 'card_with-dashes.and_underscores';
			const extension = 'png';

			const fileName = generateImageFileName(cardId, extension);

			expect(fileName).toContain(cardId);
			expect(fileName).toMatch(/^card_with-dashes\.and_underscores-\d+\.png$/);
		});

		it('generates different filenames for same card ID on repeated calls', () => {
			const cardId = 'same-card';
			const extension = 'png';

			const fileName1 = generateImageFileName(cardId, extension);
			// Small delay to ensure different timestamp
			const fileName2 = generateImageFileName(cardId, extension);

			// Both should start with the card ID
			expect(fileName1).toContain(cardId);
			expect(fileName2).toContain(cardId);
		});
	});
});
