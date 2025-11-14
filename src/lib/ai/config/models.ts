/**
 * AI Model Configuration
 *
 * Centralized configuration for AI models and parameters
 */

export const AI_MODELS = {
	GEMINI_FLASH: 'gemini-2.0-flash-001',
	GEMINI_PRO: 'gemini-1.5-pro',
	GEMINI_FLASH_IMAGE: 'gemini-2.5-flash-image-preview' // Gemini's native image generation
} as const;

export const AI_CONFIGS = {
	DECK_GENERATION: {
		model: AI_MODELS.GEMINI_FLASH,
		temperature: 0.1,
		responseMimeType: 'application/json' as const
	},
	IMAGE_GENERATION: {
		model: AI_MODELS.GEMINI_FLASH_IMAGE,
		temperature: 0.7, // More creative for image generation
		outputFormat: 'image/webp' as const,
		quality: 0.6, // Good quality for WebP
		aspectRatio: '5:7' as const,
		resolution: '1024x1434' as const
	},
	CONTENT_FILTERING: {
		model: AI_MODELS.GEMINI_FLASH,
		temperature: 0.3
	},
	TEXT_GENERATION: {
		model: AI_MODELS.GEMINI_FLASH,
		temperature: 0.3
	},
	CONNECTION_TEST: {
		model: AI_MODELS.GEMINI_FLASH,
		temperature: 0
	}
} as const;

export type AIModelType = (typeof AI_MODELS)[keyof typeof AI_MODELS];
export type AIConfigType = keyof typeof AI_CONFIGS;
