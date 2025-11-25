# AI Generation Guidelines

## Overview

This document summarizes the key guidelines for AI-generated deck content. These rules are embedded in the prompts at `/src/lib/ai/prompts/deck-generation.ts`.

## Key Principles

### 1. Universal Platform (Not RPG-Only)

Decks can be **anything**: RPG content, recipes, flashcards, humor, fan content, collections, business frameworks, fitness routines, etc.

### 2. Adaptive Stats

Stats must adapt to the theme:

- **RPG**: Power (1-20), Defense (1-20), Speed (1-20)
- **Pokemon**: HP (1-100), Attack (1-100), Defense (1-100)
- **Recipes (ingredients)**: Pasta (g): 400, Garlic cloves: 4, Olive oil (tbsp): 3
- **Recipes (general)**: Prep time (minutes), Difficulty (1-10), Servings
- **Movies**: Rating (1-10), Runtime (minutes), Year (actual)
- **Exercises**: Intensity (1-10), Duration (minutes), Calories (actual)
- **People**: Charisma (1-10), Influence (1-10), Fame (1-10)

**Stats are optional** - only include when relevant (0-4 stats per card).

**Stat descriptions are usually unnecessary:**

- For ingredients: "Pasta (g): 400" is self-explanatory - no description needed
- For abstract stats: "Power: 15" might benefit from context like "Stronger than most veterans"
- **Never write redundant descriptions** like "Amount of pasta needed" or "Number of wonton wrappers needed"

### 3. Terse Trait Descriptions

- **5-10 words maximum** per trait description
- No full sentences - keep it brief
- Example: "Fumbles words under pressure" ✅
- NOT: "This character often has difficulty expressing themselves clearly when put on the spot during interviews" ❌

### 4. One Public Trait

- **Only ONE trait should be public** (visible to all players)
- Other traits are private (hidden/secret)
- Use private traits for surprises, twists, or GM-only info

### 5. Avoid Repetition

Each section should add NEW information:

- **Description**: Main details, background, significance
- **Traits**: Additional characteristics NOT in the description
- **Stats**: Quantifiable attributes, NEW context or details

Don't repeat the same information across sections!

## Examples

### Example 1: Norwegian Celebrities as Pokemon

**Title**: Harald Eia  
**Subtitle**: Lv. 42 Media Pokemon  
**Description**: A sharp-witted comedian and science communicator who evolved from a sketch comedy duo into a documentary powerhouse. Known for challenging social norms with data and humor. Weakness: can't resist a good science debate.

**Traits:**

- "Awkward in Interviews" (public) - "Fumbles words under pressure"
- "Media Darling" (private) - "Unusually high approval rating"
- "Type: Electric/Comedian" (private) - "Shocking humor"

**Stats:**

- HP: 70
- Attack: 55
- Defense: 45
- Special Move: 80

---

### Example 2: 5-Ingredient Pasta Recipe

**Title**: Aglio e Olio (Garlic & Oil Pasta)  
**Subtitle**: Classic Italian Simplicity  
**Description**: A traditional Roman dish that transforms humble ingredients into restaurant-quality comfort food. The key is slowly toasting garlic in olive oil until golden, then tossing with al dente pasta and a splash of starchy pasta water to create a silky emulsion.

**Traits:**

- "Quick Weeknight" (public) - "Ready in 15 minutes"
- "Crowd Pleaser" (private) - "Everyone requests this"

**Stats (ingredients - no descriptions needed!):**

- Pasta (g): 400
- Garlic cloves: 4
- Olive oil (tbsp): 3
- Parmesan (g): 50

_Note: Stat descriptions are optional. For obvious things like ingredients, leave them empty. Don't write redundant text like "Amount of pasta needed"._

---

### Example 3: RPG Character

**Title**: Thalia Moonwhisper  
**Subtitle**: Elven Ranger, Shadow Walker  
**Description**: A reclusive elf who abandoned her noble house after witnessing corruption among the High Council. Now she wanders the Thornwood, protecting travelers from bandits and worse. Her silver-tipped arrows are said to be blessed by the Moon Goddess herself.

**Traits:**

- "Keen Senses" (public) - "Advantage on Perception checks"
- "Haunted Past" (private) - "Nightmares of the Council's crimes"
- "Moon Blessed" (private) - "+2 damage at night"

**Stats:**

- Combat: 14
- Stealth: 18
- Magic: 8
- Charisma: 11

## Quality Checklist

When generating a deck:

- [ ] Stats match the theme (not generic fantasy stats for non-fantasy)
- [ ] Trait descriptions are 5-10 words max
- [ ] Only ONE trait is marked public
- [ ] No repetition between description, traits, and stats
- [ ] Stats are optional and contextually relevant
- [ ] **Stat descriptions are empty unless truly needed** (no "Amount of X needed")
- [ ] Tone matches the theme (humorous, serious, educational, etc.)
- [ ] Each card is unique and interesting

## See Also

- `/docs/DECK_EXAMPLES.md` - 20+ diverse deck examples
- `/docs/IMAGE_GENERATION_EXAMPLES.md` - Image generation for different content types
- `/src/lib/ai/prompts/deck-generation.ts` - Full deck generation prompt
- `/src/lib/ai/prompts/image-generation.ts` - Full image generation prompt
- `/src/lib/ai/prompts/content-moderation.ts` - Moderation and classification
