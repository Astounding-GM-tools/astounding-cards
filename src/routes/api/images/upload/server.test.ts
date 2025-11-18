import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the R2 module - use vi.hoisted() to define variables accessible in mocks
const { mockUploadImage, mockGenerateImageFileName } = vi.hoisted(() => ({
	mockUploadImage: vi.fn(),
	mockGenerateImageFileName: vi.fn()
}));

vi.mock('$lib/server/r2', () => ({
	uploadImage: mockUploadImage,
	generateImageFileName: mockGenerateImageFileName
}));

// Mock environment variables
vi.mock('$env/static/private', () => ({
	PUBLIC_R2_PUBLIC_URL: 'https://cdn.example.com'
}));

import { POST } from './+server';

// Helper function to create a mock File with arrayBuffer method
function createMockFile(content: Uint8Array, filename: string, type: string): File {
	const file = new File([content], filename, { type });
	// Add arrayBuffer method for Node.js environment
	Object.defineProperty(file, 'arrayBuffer', {
		value: async () => content.buffer
	});
	return file;
}

describe('POST /api/images/upload', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Success Cases', () => {
		it('handles a valid PNG image file upload successfully and returns correct public URL', async () => {
			const mockFileContent = new Uint8Array([137, 80, 78, 71]); // PNG header
			const mockFile = createMockFile(mockFileContent, 'test.png', 'image/png');
			const mockCardId = 'card-123';

			const formData = new FormData();
			formData.append('file', mockFile);
			formData.append('cardId', mockCardId);

			const mockRequest = {
				formData: async () => formData
			} as any;

			mockGenerateImageFileName.mockReturnValue('card-123-1234567890.png');
			mockUploadImage.mockResolvedValue('test-prefix/cards/card-123-1234567890.png');

			const response = await POST({ request: mockRequest } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({
				success: true,
				key: 'test-prefix/cards/card-123-1234567890.png',
				url: 'https://cdn.example.com/test-prefix/cards/card-123-1234567890.png',
				fileName: 'card-123-1234567890.png',
				contentType: 'image/png',
				size: mockFileContent.length
			});

			expect(mockGenerateImageFileName).toHaveBeenCalledWith('card-123', 'png');
			expect(mockUploadImage).toHaveBeenCalledWith(
				expect.any(Buffer),
				'card-123-1234567890.png',
				'image/png'
			);
		});

		it('handles a valid JPEG image file upload successfully', async () => {
			const mockFileContent = new Uint8Array([255, 216, 255, 224]); // JPEG header
			const mockFile = createMockFile(mockFileContent, 'test.jpg', 'image/jpeg');
			const mockCardId = 'card-456';

			const formData = new FormData();
			formData.append('file', mockFile);
			formData.append('cardId', mockCardId);

			const mockRequest = {
				formData: async () => formData
			} as any;

			mockGenerateImageFileName.mockReturnValue('card-456-1234567890.jpeg');
			mockUploadImage.mockResolvedValue('test-prefix/cards/card-456-1234567890.jpeg');

			const response = await POST({ request: mockRequest } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.contentType).toBe('image/jpeg');
			expect(data.fileName).toBe('card-456-1234567890.jpeg');
			expect(mockGenerateImageFileName).toHaveBeenCalledWith('card-456', 'jpeg');
		});

		it('handles a valid WebP image file upload successfully', async () => {
			const mockFileContent = new Uint8Array([82, 73, 70, 70]); // RIFF header (WebP)
			const mockFile = createMockFile(mockFileContent, 'test.webp', 'image/webp');
			const mockCardId = 'card-789';

			const formData = new FormData();
			formData.append('file', mockFile);
			formData.append('cardId', mockCardId);

			const mockRequest = { formData: async () => formData } as any;

			mockGenerateImageFileName.mockReturnValue('card-789-1234567890.webp');
			mockUploadImage.mockResolvedValue('test-prefix/cards/card-789-1234567890.webp');

			const response = await POST({ request: mockRequest } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.contentType).toBe('image/webp');
			expect(data.fileName).toBe('card-789-1234567890.webp');
			expect(mockGenerateImageFileName).toHaveBeenCalledWith('card-789', 'webp');
		});

		it('handles jpg MIME type (image/jpg) correctly', async () => {
			const mockFileContent = new Uint8Array([255, 216, 255, 224]);
			const mockFile = createMockFile(mockFileContent, 'test.jpg', 'image/jpg');
			const mockCardId = 'card-999';

			const formData = new FormData();
			formData.append('file', mockFile);
			formData.append('cardId', mockCardId);

			const mockRequest = { formData: async () => formData } as any;

			mockGenerateImageFileName.mockReturnValue('card-999-1234567890.jpg');
			mockUploadImage.mockResolvedValue('test-prefix/cards/card-999-1234567890.jpg');

			const response = await POST({ request: mockRequest } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.contentType).toBe('image/jpg');
			expect(mockGenerateImageFileName).toHaveBeenCalledWith('card-999', 'jpg');
		});

		it('correctly converts File to Buffer before upload', async () => {
			const mockFileContent = new Uint8Array([1, 2, 3, 4, 5]);
			const mockFile = createMockFile(mockFileContent, 'test.png', 'image/png');
			const mockCardId = 'card-buffer-test';

			const formData = new FormData();
			formData.append('file', mockFile);
			formData.append('cardId', mockCardId);

			const mockRequest = { formData: async () => formData } as any;

			mockGenerateImageFileName.mockReturnValue('card-buffer-test-1234567890.png');
			mockUploadImage.mockResolvedValue('test-prefix/cards/card-buffer-test-1234567890.png');

			await POST({ request: mockRequest } as any);

			const uploadedBuffer = mockUploadImage.mock.calls[0][0];
			expect(uploadedBuffer).toBeInstanceOf(Buffer);
			expect(Array.from(uploadedBuffer)).toEqual([1, 2, 3, 4, 5]);
		});

		it('includes file size in response', async () => {
			const fileSize = 102400; // 100KB
			const mockFileContent = new Uint8Array(fileSize);
			const mockFile = createMockFile(mockFileContent, 'large.png', 'image/png');
			const mockCardId = 'card-large';

			const formData = new FormData();
			formData.append('file', mockFile);
			formData.append('cardId', mockCardId);

			const mockRequest = { formData: async () => formData } as any;

			mockGenerateImageFileName.mockReturnValue('card-large-1234567890.png');
			mockUploadImage.mockResolvedValue('test-prefix/cards/card-large-1234567890.png');

			const response = await POST({ request: mockRequest } as any);
			const data = await response.json();

			expect(data.size).toBe(fileSize);
		});
	});

	// Note: Validation error cases (missing file, invalid file type, file size limits, etc.)
	// are not tested here due to jsdom's limited FormData mocking capabilities.
	// These scenarios are better covered by E2E tests with Playwright that test the full
	// upload flow through the UI in a real browser environment.

	describe('Edge Cases', () => {
		it('handles card IDs with special characters', async () => {
			const mockFile = createMockFile(new Uint8Array([1, 2, 3]), 'test.png', 'image/png');
			const specialCardId = 'card-with_special.chars-123';

			const formData = new FormData();
			formData.append('file', mockFile);
			formData.append('cardId', specialCardId);

			const mockRequest = { formData: async () => formData } as any;

			mockGenerateImageFileName.mockReturnValue('card-with_special.chars-123-1234567890.png');
			mockUploadImage.mockResolvedValue(
				'test-prefix/cards/card-with_special.chars-123-1234567890.png'
			);

			const response = await POST({ request: mockRequest } as any);

			expect(response.status).toBe(200);
			expect(mockGenerateImageFileName).toHaveBeenCalledWith(specialCardId, 'png');
		});

		it('correctly extracts extension from MIME type', async () => {
			const testCases = [
				{ type: 'image/png', expectedExt: 'png' },
				{ type: 'image/jpeg', expectedExt: 'jpeg' },
				{ type: 'image/jpg', expectedExt: 'jpg' },
				{ type: 'image/webp', expectedExt: 'webp' }
			];

			for (const testCase of testCases) {
				vi.clearAllMocks();
				const mockFile = createMockFile(
					new Uint8Array([1, 2, 3]),
					`test.${testCase.expectedExt}`,
					testCase.type
				);

				const formData = new FormData();
				formData.append('file', mockFile);
				formData.append('cardId', 'card-ext-test');

				const mockRequest = { formData: async () => formData } as any;

				mockGenerateImageFileName.mockReturnValue(
					`card-ext-test-1234567890.${testCase.expectedExt}`
				);
				mockUploadImage.mockResolvedValue(
					`test-prefix/cards/card-ext-test-1234567890.${testCase.expectedExt}`
				);

				await POST({ request: mockRequest } as any);

				expect(mockGenerateImageFileName).toHaveBeenCalledWith(
					'card-ext-test',
					testCase.expectedExt
				);
			}
		});
	});
});
