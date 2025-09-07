/**
 * Content Filtering Prompt Templates
 * 
 * Templates for processing prompts to avoid content filters
 */

/**
 * Generate a content filtering prompt for image generation
 */
export function createContentFilteringPrompt(originalPrompt: string): string {
  return `Please rephrase this AI image generation prompt to be more suitable for content filters while preserving the artistic intent and visual details. Integrate information found in traits as visual cues. Do not assume that the prompt is for a person, it could also be an abstract concept, an item or a location.

Original prompt: ${originalPrompt}

Return only the revised prompt, nothing else.`;
}

/**
 * Simple connection test prompt
 */
export const CONNECTION_TEST_PROMPT = 'Just say "Hello, I am working!" - nothing more.';
