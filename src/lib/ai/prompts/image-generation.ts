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
export const PROMPT_OPTIMIZATION_CONTEXT = `Transform content information into a focused visual description that will create compelling artwork.

The subject can be ANYTHING:
- Characters, creatures, people (portrait-style)
- Objects, items, equipment (product-style)
- Locations, scenes, environments (landscape-style)
- Food, recipes, dishes (food photography-style)
- Concepts, ideas, abstractions (metaphorical visuals)
- Collections, documents, media (still life-style)

Ensure that the prompt does not trigger content filters by avoiding potentially problematic words or themes. If necessary, reframe the subject into a more abstract or metaphorical visual concept.

FOCUS ON:
- Visual elements, appearance, mood, atmosphere
- Subject's physical description and setting/context
- Appropriate composition style for the content type:
  * Portraits for people/characters/creatures
  * Product shots for items/objects
  * Overhead/angled for food/recipes
  * Establishing shots for locations
  * Abstract/symbolic for concepts
- Compelling visual storytelling elements

REMOVE OR TRANSFORM:
- Game mechanics, stats, numbers, quantities
- Potentially problematic words (attack, damage, weapon → descriptive alternatives)
- Abstract concepts into concrete visual metaphors
- Technical jargon into visual descriptions
- Any references to "cards" or "trading cards"
- Ingredient lists → prepared dish or key ingredients arranged

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
- Important elements (focal point, key features, significant details) are in full color and highly detailed, bold and colorful
- Background and non-essential elements are sketch-like and not coloured in yet
- Backgrounds and non-essential elements are grayscale pencil sketch/drawing style
- Use a mix of fine detail and sketchy lines
- High detail on the main subject, less detail on supporting elements`,
    modern: `Contemporary clean image:
- Neutral white or minimal background, keeping all focus on the subject
- Crisply focused, professional presentation
- Clean lines, vibrant colors, and smooth rendering
- Emphasize clarity and stark, modern aesthetics
- Balanced composition with focus on main subject
- Soft, almost imperceptible lighting, creating only the subtlest shadows
- Adapt style to content: portrait for people, product shot for objects, overhead for food, etc.`,
    inked: `Bold tattoo-inspired artwork optimized for print:
- Strong, confident black outlines defining shapes - thick enough to be a tattoo
- Vibrant, saturated colors within the bold lines (think flash tattoo palette)
- Graphic, two-dimensional aesthetic - embrace flatness, not photorealism
- Influences: traditional tattoo flash, Mexican folk art, street art murals, vintage clip art
- High contrast and bold color blocking (reds, blacks, yellows, teals)
- Simplified forms with powerful silhouettes and shapes
- Dynamic, energetic composition - this should feel alive and bold
- Graphic design sensibility - Bauhaus meets street culture
- **CRITICAL - INK ECONOMY FOR PRINT**: Completely neutral (white/empty) background - no color fills
- **NEVER solid color backgrounds** (especially black) - wastes ink and harms environment
- **Use negative space creatively** - empty background makes the subject powerful
- Optional: minimal line work or subtle etching in background if absolutely needed for context
- Think: clip art, tattoo flash sheets, screen printing - bold subject on blank paper
- Every element should be strong enough to work as a standalone tattoo or printed design
- The empty background saves ink, money, and the planet while making the art more iconic`,
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
