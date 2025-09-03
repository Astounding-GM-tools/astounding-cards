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
  type DeckGenerationResult,
} from './generators/gemini.js';

// Prompts
export {
  createDeckGenerationSchema,
  DECK_CREATION_CONTEXT,
} from './prompts/deck-generation.js';

export {
  createContentFilteringPrompt,
  CONNECTION_TEST_PROMPT,
} from './prompts/content-filtering.js';

// Config
export {
  AI_MODELS,
  AI_CONFIGS,
  type AIModelType,
  type AIConfigType,
} from './config/models.js';

// Re-export image prompt functionality (keeping existing location for now)
export {
  generateImagePrompt,
  generateSimplePrompt,
  getAvailableThemes,
  isValidTheme,
} from '../next/utils/aiImagePrompt.js';
