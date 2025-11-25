/**
 * Image Style Configuration
 *
 * Centralized configuration for AI image generation styles.
 * Used by both generation logic and UI components.
 */

import type { ImageStyle } from '$lib/next/types/deck';

export interface ImageStyleConfig {
	id: ImageStyle;
	name: string;
	description: string;
	prompt: string; // Full prompt used for generation
}

/**
 * All available image styles with their generation prompts
 */
export const IMAGE_STYLES: Record<ImageStyle, ImageStyleConfig> = {
	classic: {
		id: 'classic',
		name: 'Classic',
		description:
			'Pencil sketch with selective coloring - detailed watercolor style with grayscale backgrounds',
		prompt: `Pencil sketch with coloured details:
- Similar to a partially completed, highly detailed masterful watercolor painting
- Important elements (focal point, key features, significant details) are in full color and highly detailed, bold and colorful
- Background and non-essential elements are sketch-like and not coloured in yet
- Backgrounds and non-essential elements are grayscale pencil sketch/drawing style
- Use a mix of fine detail and sketchy lines
- High detail on the main subject, less detail on supporting elements`
	},
	modern: {
		id: 'modern',
		name: 'Modern',
		description:
			'Contemporary clean image with neutral backgrounds - crisp focus and professional presentation',
		prompt: `Contemporary clean image:
- Neutral white or minimal background, keeping all focus on the subject
- Crisply focused, professional presentation
- Clean lines, vibrant colors, and smooth rendering
- Emphasize clarity and stark, modern aesthetics
- Balanced composition with focus on main subject
- Soft, almost imperceptible lighting, creating only the subtlest shadows
- Adapt style to content: portrait for people, product shot for objects, overhead for food, etc.`
	},
	inked: {
		id: 'inked',
		name: 'Inked',
		description:
			'Bold tattoo-inspired artwork - strong outlines, vibrant colors, white background for print economy',
		prompt: `Bold tattoo-inspired artwork optimized for print:
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
- The empty background saves ink, money, and the planet while making the art more iconic`
	}
};

/**
 * Get array of all image styles for UI dropdowns
 */
export function getImageStyles(): ImageStyleConfig[] {
	return Object.values(IMAGE_STYLES);
}

/**
 * Get a specific image style by ID
 */
export function getImageStyle(id: ImageStyle): ImageStyleConfig {
	return IMAGE_STYLES[id];
}

/**
 * Get the generation prompt for a specific style
 */
export function getStylePrompt(id: ImageStyle): string {
	return IMAGE_STYLES[id].prompt;
}
