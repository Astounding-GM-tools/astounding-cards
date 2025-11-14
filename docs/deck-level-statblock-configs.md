# Deck-Level Statblock Configuration System

## Core Concept

Instead of fixed stat vocabularies, implement a deck-level configuration system that defines the **statblock structure and vocabulary** itself. This allows complete customization of what stats are available and how they're named, supporting different RPG systems with their unique terminologies.

## Key Features

### Customizable Stat Vocabularies

- **OSR Systems**: "THAC0" instead of "Defense", "Hit Dice" instead of "Health"
- **Modern D&D**: "Armor Class", "Hit Points", "Saving Throws"
- **Custom Systems**: Completely user-defined stat names and structures
- **Multiple Instances**: Support for multiple stats of the same type (e.g., "Primary Health", "Temporary Health")

### System Templates

Provide built-in templates for common RPG systems:

- **OSR/Classic D&D**: THAC0, AC (descending), Hit Dice, Saving Throws
- **Modern D&D 5e**: AC, HP, Proficiency Bonus, Ability Scores, Saves
- **Generic Modern**: Defense, Health, Initiative, Skills
- **Narrative Systems**: Drives, Conditions, Resources
- **Custom**: Blank template for complete customization

### Configuration Structure

```javascript
// Example deck statblock config
{
  systemName: "OSR Classic",
  categories: {
    combat: {
      name: "Combat Stats",
      stats: [
        { key: "thac0", name: "THAC0", type: "number", trackable: false },
        { key: "ac", name: "Armor Class", type: "number", trackable: false },
        { key: "hp", name: "Hit Points", type: "number", trackable: true }
      ]
    },
    saves: {
      name: "Saving Throws",
      stats: [
        { key: "save_death", name: "Death Ray/Poison", type: "number" },
        { key: "save_wands", name: "Magic Wands", type: "number" }
      ]
    }
  }
}
```

### User Experience

1. **Deck Creation**: Choose a system template or start custom
2. **Vocabulary Editing**: Modify stat names, add/remove stats, reorganize categories
3. **Card Integration**: New cards inherit the deck's statblock structure
4. **Template Application**: Apply deck templates to existing cards (with merge/overwrite options)

### Implementation Strategy

1. **Phase 1**: Basic deck-level config storage and selection
2. **Phase 2**: Built-in system templates (OSR, 5e, Generic)
3. **Phase 3**: Full custom vocabulary editor
4. **Phase 4**: Import/export configs, community sharing

## Benefits

- **System Agnostic**: Support any RPG system or custom game
- **Consistency**: All cards in a deck use the same vocabulary
- **Efficiency**: Bulk changes to statblock structure across all cards
- **Flexibility**: Mix and match concepts from different systems
- **Community**: Share and import statblock configurations

## Technical Notes

- Configs stored at deck level in IndexedDB
- Backward compatibility with existing card mechanics
- Migration tools for updating existing cards when configs change
- Validation to ensure config integrity

---

_This captures the "awesome ideas" discussed earlier about making statblock vocabularies completely customizable at the deck level, supporting everything from OSR systems with THAC0 to completely custom game mechanics._
