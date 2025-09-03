/**
 * Content Filtering Prompt Templates
 * 
 * Templates for processing prompts to avoid content filters
 */

/**
 * Generate a content filtering prompt for image generation
 */
export function createContentFilteringPrompt(originalPrompt: string): string {
  return `Please rephrase this AI image generation prompt to be more suitable for content filters while preserving the artistic intent and visual details. Make personality traits less direct and more visually descriptive:

Original prompt: ${originalPrompt}

Return only the revised prompt, nothing else.`;
}

/**
 * Simple connection test prompt
 */
export const CONNECTION_TEST_PROMPT = 'Just say "Hello, I am working!" - nothing more.';
