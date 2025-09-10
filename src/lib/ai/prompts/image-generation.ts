/**
 * Image Generation Prompt Templates
 * 
 * System instructions and prompts for generating card artwork with Gemini
 */

/**
 * System instruction that defines the image generation task and style requirements
 */
/**
 * System instruction for optimizing card content into visual image prompts
 */
export const PROMPT_OPTIMIZATION_CONTEXT = `Transform content information into a focused visual description that will create compelling artwork for items, locations, concepts or character portraits.

Ensure that the prompt does not trigger content filters by avoiding potentially problematic words or themes. If necessary, reframe the subject into a more abstract or metaphorical visual concept.

FOCUS ON:
- Visual elements, appearance, mood, atmosphere
- Subject's physical description and setting
- Compelling visual storytelling elements
- Portrait-style composition when appropriate

REMOVE OR TRANSFORM:
- Game mechanics, stats, numbers
- Potentially problematic words (attack, damage, weapon → descriptive alternatives)
- Abstract concepts into concrete visual metaphors
- Technical jargon into visual descriptions
- Any references to "cards" or "trading cards"

ALWAYS ADD:
- "Portrait orientation artwork"
- "No text, numbers, or writing visible in the image"
- Clear subject focus and composition guidance
- Atmospheric and mood descriptors

Return ONLY the optimized visual prompt text, nothing else.`;

/**
 * System instruction for generating images with multi-part context
 */
export const IMAGE_GENERATION_CONTEXT = `CRITICAL: Generate artwork following these MANDATORY specifications:

- Use the full canvas area edge-to-edge, no borders or margins
- Composition focused on the main subject
- All important visual elements must be centered and in the upper 2/3 of the image
- Center composition on upper portions of image
- Follow attached art style exactly

FORBIDDEN:
- No text, numbers, or writing anywhere in the image
- No borders, frames, or margins around the artwork`;

export const ART_STYLES = {
    classic: `Pencil sketch with coloured details:
- Similar to a partially completed, highly detailed masterful watercolor painting
- Important elements include faces, hands, fabrics, metals and object of special significance
- Important elements are in full color and highly detailed, bold and colorful
- Background and non-essential elements are sketch-like and not coloured in yet
- Backgrounds and non-essential elements are grayscale pencil sketch/drawing style
- Use a mix of fine detail and sketchy lines
- High detail on important elements, less detail on non-essential elements`,
    modern: `Contemporary portrait or product image:
- Neutral white background, keeping all focus on the subject
- Crisply focused digital photography
- Clean lines, vibrant colors, and smooth shading
- Emphasize clarity and stark, modern aesthetics
- Balanced composition with focus on main subject
- Soft, almost imperceptible lighting, creating only the subtlest shadows`,
    inked: `Bold ink drawing with high contrast:
- Strong, confident black ink lines defining shapes and details
- High contrast between light and dark areas
- Minimal shading, relying on line work to convey depth and texture
- Ink-effective cross-hatching and stippling for shading
- Dynamic and expressive line work, conveying energy and movement
- Simple or neutral backgrounds, keeping focus on the main subject
- Dynamic composition with a sense of movement and energy
- Emphasize dramatic lighting and shadow play`,
};


/**
 * Create the optimization request for card content
 */
export function createPromptOptimizationRequest(
    title: string,
    subtitle: string,
    description: string,
    theme: string,
    traits: Array<{title: string; description: string; isPublic: boolean}> = [],
    stats: Array<{title: string; value: number; isPublic: boolean}> = []
): string {
    const parts: string[] = [];
    
    // Basic card info
    parts.push(`Title: ${title}`);
    if (subtitle) parts.push(`Type: ${subtitle}`);
    if (description) parts.push(`Description: ${description}`);
    parts.push(`Theme: ${theme}`);
    
    // Key traits (only public ones for visuals)
    const publicTraits = traits.filter(trait => trait.isPublic);
    if (publicTraits.length > 0) {
        const traitDescriptions = publicTraits
            .slice(0, 3) // Limit for focus
            .map(trait => `${trait.title}: ${trait.description}`)
            .join(', ');
        parts.push(`Key traits: ${traitDescriptions}`);
    }
    
    // Notable stats (if relevant for visuals)
    const publicStats = stats.filter(stat => stat.isPublic);
    if (publicStats.length > 0) {
        const statDescriptions = publicStats
            .slice(0, 2) // Very limited for optimization
            .map(stat => `${stat.title}: ${stat.value}`)
            .join(', ');
        parts.push(`Notable attributes: ${statDescriptions}`);
    }
    
    const cardInfo = parts.join('\n');
    return `Transform this card into an optimal image prompt:\n\n${cardInfo}`;
}
