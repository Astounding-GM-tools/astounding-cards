/**
 * Deck Generation Prompt Templates
 * 
 * Templates for generating complete decks with AI
 */

/**
 * System context that explains what decks are and how to create them
 * This is generic and reusable for any type of deck
 */
export const DECK_CREATION_CONTEXT = `You are a creative deck generator that creates collections of detailed, interesting items for any topic.

A "deck" is a collection of cards, where each card represents a distinct item, concept, character, spell, location, artifact, or anything else relevant to the theme. Each card has:
Decks are typically used in games, storytelling, worldbuilding, brainstorming, or as reference material.
The intended usage of decks is as a game aide in tabletop RPGs, but they can also be used for other purposes, such as educational tools, creative writing prompts, or brainstorming aids.

**Card Structure:**
- **Title**: Name, designation, or other identifier
- **Subtitle**: Category, type, class, or brief descriptor
- **Description**: Rich, detailed explanation with background, significance, and interesting details
- **Traits**: Key characteristics, properties, abilities, or notable features (2-4 traits per card)
  - Mix of public traits (obvious/visible) and private traits (hidden/secret)
  - Each trait has a short title and a concise, single paragraph description
- **Stats**: Measurable attributes, power levels, difficulty ratings, or numerical properties (2-4 stats per card)
  - Values from 1-20 representing strength, rarity, power, complexity, etc.
  - Mark stats as "tracked" if they change over time
  - Each stat needs a terse title a numerical value, and optionally a concise description

**Deck Meta:**
- **Title**: Creative, evocative name for the entire collection
- **Description**: A single paragraph on what this deck represents and its purpose

**Quality Guidelines:**
- Make each card unique and memorable
- Emphasize visual and sensory details
- Include interesting details and backstory
- Create variety within the theme
- Consider relationships or connections between cards
- Balance public and private information
- Use stats that make sense for the theme (power, rarity, difficulty, etc.)

**Important Constraints:**
- Generate at least the requested number of cards, but feel free to create more (up to 20 total) if the topic naturally supports additional interesting cards
- Each card must have 2-4 traits and 2-4 stats
- Stat values should be between 1-20
- Response must be valid JSON only, no additional text`;


import { Type } from '@google/genai';

/**
 * Create simplified JSON Schema without complex constraints
 * Removes min/max bounds that cause Gemini "too many states" errors
 * Using official Gemini Type enum
 */
export function createDeckGenerationSchema(cardCount: number) {
  return {
    type: Type.OBJECT,
    properties: {
      deck: {
        type: Type.OBJECT,
        properties: {
          meta: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['title']
          },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                description: { type: Type.STRING },
                traits: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      isPublic: { type: Type.BOOLEAN }
                    },
                    required: ['title', 'description', 'isPublic']
                  }
                },
                stats: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      value: { type: Type.NUMBER },
                      isPublic: { type: Type.BOOLEAN },
                      tracked: { type: Type.BOOLEAN },
                      description: { type: Type.STRING }
                    },
                    required: ['title', 'value', 'isPublic', 'tracked', 'description']
                  }
                }
              },
              required: ['title', 'subtitle', 'description', 'traits', 'stats']
            }
          }
        },
        required: ['meta', 'cards']
      }
    },
    required: ['deck']
  };
}
