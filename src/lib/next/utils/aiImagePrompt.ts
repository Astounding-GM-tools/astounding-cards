/**
 * AI Image Prompt Generation Utility
 * 
 * Generates contextual image prompts for cards based on their content,
 * including name, role, description, traits, and deck theme.
 */

import type { Card } from '../types/card.js';

/**
 * Theme-based style mappings for different deck themes
 */
const THEME_STYLES = {
    'fantasy': 'fantasy art style, medieval setting, magical atmosphere',
    'sci-fi': 'sci-fi art style, futuristic setting, cyberpunk aesthetic', 
    'cyberpunk': 'cyberpunk art style, neon lighting, futuristic dystopian setting',
    'steampunk': 'steampunk art style, Victorian-era industrial, brass and copper machinery',
    'horror': 'dark horror art style, gothic atmosphere, mysterious shadows',
    'western': 'western art style, old west setting, dusty frontier atmosphere',
    'modern': 'contemporary art style, modern setting, realistic lighting',
    'anime': 'anime art style, manga-inspired, Japanese animation aesthetic',
    'classic': 'classic art style, timeless appearance, traditional painting style',
    'noir': 'film noir style, black and white aesthetic, dramatic shadows'
} as const;

/**
 * Quality and technical specifications for AI image generation
 */
const IMAGE_SPECS = {
    aspectRatio: '5:7 aspect ratio',
    quality: 'high quality, detailed',
    composition: 'portrait composition, centered subject',
    resolution: 'sharp focus, professional lighting',
    artStyle: 'hybrid pencil sketch with selective coloring, mostly grayscale pencil drawing with key features in full color (photorealistic or classical brushwork style), ink-economical design'
} as const;

/**
 * Generate a comprehensive AI image prompt based on card content
 */
export function generateImagePrompt(card: Card, deckTheme: string = 'fantasy'): string {
    const promptParts = [];
    
    // 1. CRITICAL: Orientation and composition requirements first
    promptParts.push('5:7 aspect ratio, portrait orientation, vertical composition, taller than wide');
    promptParts.push('. Main subject centered in upper half of image, leaving space at bottom for text overlay');
    
    // 2. Main subject with proper formatting
    const mainSubject = buildMainSubject(card);
    if (mainSubject) {
        promptParts.push(`. ${mainSubject}`);
    }
    
    // 3. Physical description with proper punctuation
    const physicalDesc = extractPhysicalDescription(card.description || '');
    if (physicalDesc) {
        promptParts.push(`. ${physicalDesc}`);
    }
    
    // 4. Traits with descriptions
    const traitsDesc = buildTraitsDescription(card.traits || []);
    if (traitsDesc) {
        promptParts.push(`. ${traitsDesc}`);
    }
    
    // 5. Art style and technical specifications
    const artAndTechSpecs = buildArtAndTechSpecs(deckTheme);
    promptParts.push(`. ${artAndTechSpecs}`);
    
    // 6. Encouraging finish
    promptParts.push('. Make It Astounding!');
    
    return promptParts.join('');
}

/**
 * Build the main subject description from name and role
 */
function buildMainSubject(card: Card): string {
    const parts = [];
    
    if (card.title) {
        parts.push(card.title);
    }
    
    if (card.subtitle) {
        const subtitle = card.subtitle.trim();
        
        // Handle "from [Source]" case
        if (subtitle.toLowerCase().startsWith('from ')) {
            parts.push(subtitle);
        } else {
            // Determine if it's likely a character, item, location, or other
            const lowerSubtitle = subtitle.toLowerCase();
            if (isCharacterType(lowerSubtitle)) {
                parts.push(`a ${subtitle}`);
            } else if (isItemType(lowerSubtitle)) {
                parts.push(`an ${subtitle}`);
            } else if (isLocationOrConceptType(lowerSubtitle)) {
                parts.push(subtitle);
            } else {
                parts.push(`a ${subtitle}`);
            }
        }
    }
    
    return parts.length > 0 ? parts.join(', ') : 'subject';
}

/**
 * Check if subtitle indicates a character type
 */
function isCharacterType(subtitle: string): boolean {
    const characterTypes = ['character', 'person', 'warrior', 'mage', 'knight', 'rogue', 'wizard', 'priest', 'hero', 'villain', 'npc', 'creature', 'monster', 'beast', 'dragon', 'spirit', 'demon', 'angel', 'merchant', 'guard', 'noble', 'peasant', 'soldier'];
    return characterTypes.some(type => subtitle.includes(type));
}

/**
 * Check if subtitle indicates an item type
 */
function isItemType(subtitle: string): boolean {
    const itemTypes = ['item', 'weapon', 'armor', 'tool', 'artifact', 'relic', 'potion', 'scroll', 'book', 'gem', 'ring', 'amulet', 'staff', 'sword', 'shield', 'bow', 'dagger', 'wand', 'orb', 'crown', 'treasure'];
    return itemTypes.some(type => subtitle.includes(type));
}

/**
 * Check if subtitle indicates a location or abstract concept
 */
function isLocationOrConceptType(subtitle: string): boolean {
    const locationTypes = ['location', 'place', 'building', 'castle', 'tower', 'dungeon', 'forest', 'mountain', 'river', 'city', 'village', 'temple', 'shrine', 'spell', 'magic', 'enchantment', 'curse', 'blessing', 'ritual', 'phenomenon', 'event'];
    return locationTypes.some(type => subtitle.includes(type));
}

/**
 * Extract physical descriptions from the card's description text
 */
function extractPhysicalDescription(description: string): string {
    if (!description || description.trim().length === 0) {
        return '';
    }
    
    // Simple heuristic: take the first sentence or up to 100 characters
    const cleaned = description.trim();
    const firstSentence = cleaned.split(/[.!?]/)[0];
    
    if (firstSentence && firstSentence.length > 10 && firstSentence.length <= 150) {
        return firstSentence.trim();
    }
    
    // Fallback: use first 100 characters
    if (cleaned.length <= 100) {
        return cleaned;
    }
    
    return cleaned.substring(0, 100).trim() + '...';
}

/**
 * Convert traits into visual appearance descriptions
 */
function buildTraitDescription(traits: Array<{title: string; description?: string}>): string {
    if (!traits || traits.length === 0) {
        return '';
    }
    
    // Extract visual/personality traits and convert them to appearance keywords
    const visualTraits = traits
        .map(trait => convertTraitToVisual(trait.title))
        .filter(Boolean)
        .slice(0, 3); // Limit to 3 most important traits
    
    if (visualTraits.length === 0) {
        return '';
    }
    
    return `appearing ${visualTraits.join(', ')}`;
}

/**
 * Convert personality traits to visual appearance keywords
 */
function convertTraitToVisual(trait: string): string {
    const lowerTrait = trait.toLowerCase();
    
    // Map personality traits to visual characteristics
    const traitMappings: Record<string, string> = {
        // Personality -> Visual
        'brave': 'confident and heroic',
        'wise': 'wise and contemplative', 
        'mysterious': 'enigmatic and shadowy',
        'fierce': 'intense and powerful',
        'gentle': 'kind and serene',
        'cunning': 'sly and intelligent',
        'noble': 'regal and dignified',
        'wild': 'untamed and fierce',
        'ancient': 'weathered and timeless',
        'young': 'youthful and energetic',
        'old': 'aged and experienced',
        'strong': 'muscular and powerful',
        'agile': 'lithe and graceful',
        'magical': 'mystical and otherworldly',
        'dark': 'shadowy and brooding',
        'light': 'radiant and pure',
        'evil': 'menacing and sinister',
        'good': 'noble and virtuous',
        'charismatic': 'confident and attractive',
        'intimidating': 'formidable and imposing'
    };
    
    // Check for exact matches first
    if (traitMappings[lowerTrait]) {
        return traitMappings[lowerTrait];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(traitMappings)) {
        if (lowerTrait.includes(key) || key.includes(lowerTrait)) {
            return value;
        }
    }
    
    // For traits that don't map to visual characteristics, use them directly if they seem visual
    if (isVisualTrait(lowerTrait)) {
        return lowerTrait;
    }
    
    return ''; // Skip non-visual traits
}

/**
 * Check if a trait likely describes visual characteristics
 */
function isVisualTrait(trait: string): boolean {
    const visualKeywords = [
        'tall', 'short', 'big', 'small', 'thin', 'thick', 'broad', 'narrow',
        'red', 'blue', 'green', 'black', 'white', 'brown', 'blonde', 'gray', 'grey',
        'bearded', 'clean-shaven', 'scarred', 'tattooed', 'robed', 'armored',
        'hooded', 'cloaked', 'elegant', 'rough', 'smooth', 'weathered'
    ];
    
    return visualKeywords.some(keyword => trait.includes(keyword));
}

/**
 * Build selective coloring guidance based on card content
 */
function buildSelectiveColoringGuidance(card: Card): string {
    const coloringElements = [];
    const subtitle = card.subtitle?.toLowerCase() || '';
    const description = card.description?.toLowerCase() || '';
    
    // Character-specific coloring guidance
    if (isCharacterType(subtitle)) {
        coloringElements.push('face, hands and items of importance in full color');
        
        // Look for specific features mentioned in description only
        if (description.includes('eye') || description.includes('gaze') || description.includes('stare')) {
            coloringElements.push('eyes in vivid color');
        }
        
        if (description.includes('magic') || description.includes('glow') || description.includes('aura') || description.includes('power')) {
            coloringElements.push('magical elements in bright color');
        }
    }
    
    // Item-specific coloring guidance
    else if (isItemType(subtitle)) {
        coloringElements.push('key item features in full color');
        
        if (description.includes('gem') || description.includes('jewel') || description.includes('crystal')) {
            coloringElements.push('gems and jewels in vivid color');
        }
        
        if (description.includes('metal') || description.includes('gold') || description.includes('silver') || description.includes('bronze')) {
            coloringElements.push('metallic parts in realistic color');
        }
    }
    
    // Location/concept-specific coloring
    else if (isLocationOrConceptType(subtitle)) {
        coloringElements.push('focal architectural or natural elements in selective color');
        
        if (description.includes('light') || description.includes('glow') || description.includes('fire') || description.includes('flame')) {
            coloringElements.push('light sources in warm color');
        }
    }
    
    // Default guidance - simplified
    if (coloringElements.length === 0) {
        coloringElements.push('face, hands and items of importance in full color');
    }
    
    return `Selective coloring: ${coloringElements.join(', ')}, background and secondary details remain pencil sketch`;
}

/**
 * Build traits description with title and descriptions
 */
function buildTraitsDescription(traits: Array<{title: string; description?: string}>): string {
    if (!traits || traits.length === 0) {
        return '';
    }
    
    const traitDescriptions = traits
        .filter(trait => trait.title && trait.title.trim() !== '')
        .slice(0, 3) // Limit to 3 most important traits
        .map(trait => {
            if (trait.description && trait.description.trim() !== '') {
                return `${trait.title} - ${trait.description}`;
            } else {
                return trait.title;
            }
        });
    
    return traitDescriptions.join('. ');
}

/**
 * Build combined art and technical specifications
 */
function buildArtAndTechSpecs(deckTheme: string): string {
    const specs = [];
    
    // Art style explanation
    specs.push('Art style: hybrid pencil sketch with selective coloring');
    specs.push('The background is pencil sketch, but face, hands and items of importance are highly detailed and in full color');
    
    // Theme style
    const themeStyle = getThemeStyle(deckTheme);
    specs.push(themeStyle);
    
    // Technical specs - consolidated with print friendly
    specs.push('high quality, detailed, sharp focus, print friendly');
    
    return specs.join('. ');
}

/**
 * Get theme-appropriate artistic style
 */
function getThemeStyle(theme: string): string {
    const normalizedTheme = theme.toLowerCase();
    
    // Check for exact match
    if (normalizedTheme in THEME_STYLES) {
        return THEME_STYLES[normalizedTheme as keyof typeof THEME_STYLES];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(THEME_STYLES)) {
        if (normalizedTheme.includes(key) || key.includes(normalizedTheme)) {
            return value;
        }
    }
    
    // Default to fantasy if no match
    return THEME_STYLES.fantasy;
}

/**
 * Generate a simplified prompt for testing/debugging
 */
export function generateSimplePrompt(card: Card): string {
    return `Portrait of ${card.title || 'character'}${card.subtitle ? `, a ${card.subtitle}` : ''}, 5:7 aspect ratio, high quality art`;
}

/**
 * Get available theme options
 */
export function getAvailableThemes(): string[] {
    return Object.keys(THEME_STYLES);
}

/**
 * Validate that a theme is supported
 */
export function isValidTheme(theme: string): boolean {
    return getAvailableThemes().includes(theme.toLowerCase());
}
