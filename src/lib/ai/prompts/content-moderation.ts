/**
 * Content Moderation & Classification Prompts
 * 
 * For analyzing published decks for safety, categorization, and quality
 */

import { Type } from '@google/genai';

/**
 * Taxonomy of deck categories and tags
 */
export const DECK_TAXONOMY = {
  // Primary categories
  categories: [
    'rpg',           // Tabletop RPG content
    'educational',   // Learning materials, study aids
    'recipes',       // Food and drink recipes
    'flashcards',    // Language learning, trivia
    'worldbuilding', // Settings, locations, lore
    'creative',      // Writing prompts, art inspiration
    'reference',     // Quick reference materials
    'game',          // Game mechanics, items
    'other'          // Uncategorized
  ],
  
  // RPG subcategories
  rpgSystems: [
    'dnd',           // D&D (all editions)
    'pathfinder',    // Pathfinder 1e/2e
    'wfrp',          // Warhammer Fantasy Roleplay
    'call-of-cthulhu', // Call of Cthulhu
    'fate',          // FATE system
    'pbta',          // Powered by the Apocalypse
    'osr',           // Old School Revival
    'generic',       // System-agnostic
    'other-rpg'      // Other RPG systems
  ],
  
  // Themes and genres
  themes: [
    'fantasy',       // High fantasy, medieval
    'scifi',         // Science fiction
    'cyberpunk',     // Cyberpunk, near-future tech
    'horror',        // Horror, scary themes
    'historical',    // Real-world historical
    'modern',        // Contemporary setting
    'post-apocalyptic', // Post-apocalyptic
    'steampunk',     // Steampunk, victorian tech
    'superhero',     // Superhero genre
    'mystery',       // Mystery, detective
    'comedy',        // Humorous, lighthearted
    'dark',          // Dark, grim themes
    'whimsical',     // Lighthearted, fairy tale
  ],
  
  // Content types
  contentTypes: [
    'characters',    // NPCs, PCs, monsters
    'locations',     // Places, buildings, regions
    'items',         // Equipment, artifacts, treasure
    'spells',        // Magic, abilities, powers
    'encounters',    // Combat, challenges, events
    'plot-hooks',    // Story ideas, quests
    'lore',          // Background, history
    'mechanics',     // Rules, systems
  ],
  
  // Quality indicators
  qualityFlags: [
    'high-effort',   // Clearly handcrafted with care
    'original-art',  // Custom artwork
    'well-illustrated', // Has good images
    'creative',      // Unique and imaginative
    'practical',     // Useful and actionable
    'detailed',      // Rich in detail
    'cohesive',      // Well-structured theme
    'ai-generated',  // Clearly AI-generated
    'generic',       // Formulaic, lacks uniqueness
  ]
} as const;

/**
 * System instruction for content moderation and analysis
 */
export const MODERATION_CONTEXT = `You are a content moderator and classifier for a tabletop RPG card deck platform.

**Your Task:**
Analyze deck content for:
1. Safety (moderation)
2. Classification (categories, tags, themes)
3. Quality assessment
4. Language detection

**Moderation Guidelines:**

**BLOCK (reject entirely):**
- Illegal content (CSAM, terrorism, etc.)
- Hate speech targeting protected groups
- Extreme graphic violence (gore, torture)
- Doxxing or harassment

**WARN (allow with content tags):**
- Sexual content → 'mature_sexual'
- Moderate violence/combat → 'mature_violent'
- Disturbing/horror themes → 'mature_disturbing'

**ALLOW (no warnings needed):**
- Fantasy violence (swords, combat)
- Moderate sensuality (barbarians in loincloths, seductive characters)
- Horror/scary themes (lovecraftian, gothic)
- Alcohol/drug references in fantasy context

**Classification:**
- Identify primary category and subcategories
- Tag with relevant themes and content types
- Detect language
- Estimate appropriate age rating

**Quality Scoring (0-10):**
- 0-3: Low effort, generic, minimal detail
- 4-6: Decent quality, functional
- 7-8: High quality, creative, detailed
- 9-10: Exceptional, worthy of Editor's Pick

**Quality Indicators:**
- Originality and creativity
- Level of detail and effort
- Coherence and usefulness
- Visual quality (if images present)
- Writing quality

Be permissive with RPG content. This is a platform for creative game materials.`;

/**
 * Schema for moderation and classification response
 */
export function createModerationSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      moderation: {
        type: Type.OBJECT,
        properties: {
          status: {
            type: Type.STRING,
            enum: ['safe', 'warning', 'blocked']
          },
          blockedReason: { type: Type.STRING },
          warnings: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              enum: ['mature_sexual', 'mature_violent', 'mature_disturbing']
            }
          },
          flaggedCards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                cardTitle: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ['cardTitle', 'reason']
            }
          }
        },
        required: ['status', 'warnings']
      },
      classification: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: DECK_TAXONOMY.categories
          },
          subcategories: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          themes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          contentTypes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          language: { type: Type.STRING },
          estimatedAge: {
            type: Type.STRING,
            enum: ['all-ages', '12+', '16+', '18+']
          }
        },
        required: ['category', 'language', 'estimatedAge']
      },
      quality: {
        type: Type.OBJECT,
        properties: {
          score: {
            type: Type.NUMBER,
            description: 'Quality score from 0-10'
          },
          isEditorsPick: { type: Type.BOOLEAN },
          qualityFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          reasoning: { type: Type.STRING }
        },
        required: ['score', 'isEditorsPick', 'qualityFlags']
      }
    },
    required: ['moderation', 'classification', 'quality']
  };
}

/**
 * Create prompt for analyzing deck content
 */
export function createModerationPrompt(deckJson: string): string {
  return `Analyze this deck for moderation, classification, and quality:

${deckJson}

Return a structured analysis following the response schema.`;
}
