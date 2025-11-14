/**
 * AI Module - Main exports
 *
 * Centralized exports for all AI functionality
 */

// Generators
export {
	testGeminiConnection,
	processPromptForContentFiltering,
	generateDeckFromPrompt,
	type AIResult,
	type DeckGenerationResult
} from './generators/gemini.js';

export {
	generateCardImage,
	testImageGeneration,
	type ImageGenerationResult
} from './generators/image.js';

// Prompts
export { createDeckGenerationSchema, DECK_CREATION_CONTEXT } from './prompts/deck-generation.js';

export {
	createContentFilteringPrompt,
	CONNECTION_TEST_PROMPT
} from './prompts/content-filtering.js';

// Config
export { AI_MODELS, AI_CONFIGS, type AIModelType, type AIConfigType } from './config/models.js';

// Re-export image prompt functionality (keeping existing location for now)
export {
	generateImagePrompt,
	generateSimplePrompt,
	getAvailableThemes,
	isValidTheme
} from '../next/utils/aiImagePrompt.js';

// Helper functions with toast feedback
import { toasts } from '$lib/stores/toast';
import { generateDeckFromPrompt } from './generators/gemini.js';
import { generateCardImage } from './generators/image.js';
import type { Card, CardSize } from '$lib/types.js';

/**
 * Generate deck with toast feedback
 *
 * This helper provides a loading spinner toast and success/error toasts
 * while handling the generation process.
 */
export async function generateDeckWithToasts(apiKey: string, theme: string, cardCount: number = 8) {
	// Create a loading toast that will remain until complete
	const toastId = toasts.loading(`Generating deck: "${theme}" (${cardCount}+ cards)`);

	try {
		// Run the actual generation
		const result = await generateDeckFromPrompt(apiKey, theme, cardCount);

		if (result.success && result.deck) {
			// Update the spinner toast with success and give it a timeout
			toasts.update(toastId, {
				type: 'success',
				message: `✅ Generated ${result.deck.deck.cards.length} cards for "${result.deck.deck.meta.title}"`,
				timeout: 5000,
				dismissible: true
			});
			return result;
		} else {
			// Update the spinner toast with error
			toasts.update(toastId, {
				type: 'error',
				message: `⚠️ ${result.error || 'Failed to generate deck'}`,
				timeout: 8000,
				dismissible: true
			});
			return result;
		}
	} catch (error) {
		// Something went wrong - show error toast
		toasts.update(toastId, {
			type: 'error',
			message: `⚠️ ${error instanceof Error ? error.message : 'Unknown error'}`,
			timeout: 8000,
			dismissible: true
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Generate card image with toast feedback
 *
 * This helper provides a loading spinner toast and success/error toasts
 * while handling the image generation process.
 */
export async function generateCardImageWithToasts(
	apiKey: string,
	card: Card,
	deckTheme: string = 'classic',
	cardSize: CardSize = 'tarot'
) {
	// Create a loading toast that will remain until complete
	const toastId = toasts.loading(`Generating image for "${card.title}"`);

	try {
		// Run the actual image generation
		const result = await generateCardImage(apiKey, card, deckTheme, cardSize);

		if (result.success && result.processedBlob) {
			// Update the spinner toast with success and give it a timeout
			toasts.update(toastId, {
				type: 'success',
				message: `✅ Image generated for "${card.title}"`,
				timeout: 5000,
				dismissible: true
			});
			return result;
		} else {
			// Update the spinner toast with error
			toasts.update(toastId, {
				type: 'error',
				message: `⚠️ ${result.error || 'Failed to generate image'}`,
				timeout: 8000,
				dismissible: true
			});
			return result;
		}
	} catch (error) {
		// Something went wrong - show error toast
		toasts.update(toastId, {
			type: 'error',
			message: `⚠️ ${error instanceof Error ? error.message : 'Unknown error'}`,
			timeout: 8000,
			dismissible: true
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
