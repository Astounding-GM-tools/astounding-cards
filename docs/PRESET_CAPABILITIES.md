# Preset Capabilities System

## Overview

The preset capabilities system allows the UI to adapt based on what each card preset actually supports, rather than hardcoding preset name comparisons throughout the codebase.

## Implementation

### Core File
`src/lib/next/utils/presetCapabilities.ts`

Defines:
- `PresetCapabilities` interface - All possible preset features
- `PRESET_CAPABILITIES` - Configuration for each preset
- `getPresetCapabilities(preset)` - Get capabilities for a preset
- `presetSupports(preset, capability)` - Check if preset supports a feature

### Capabilities

```typescript
interface PresetCapabilities {
  // Display fields
  supportsTitle: boolean;
  supportsSubtitle: boolean;
  supportsDescription: boolean;
  supportsImage: boolean;

  // Data fields
  supportsStats: boolean;
  supportsTraits: boolean;

  // Layout options
  hasBackCard: boolean;
}
```

### Current Presets

**Minimal:**
- ✅ Title, Subtitle, Description, Image
- ❌ Stats, Traits
- ✅ Has back card (shows description)

**Trading:**
- ✅ All fields supported
- ✅ Has back card (shows stats/traits)

## Usage

### In Components

```typescript
import { getPresetCapabilities } from '$lib/next/utils/presetCapabilities.js';

let preset = $derived(currentDeck?.meta.preset || 'trading');
let capabilities = $derived(getPresetCapabilities(preset));

// Conditionally render form sections
{#if capabilities.supportsStats}
  <StatsEditor />
{/if}

{#if capabilities.supportsTraits}
  <TraitsEditor />
{/if}

{#if capabilities.hasBackCard}
  <BackCardPreview />
{/if}
```

### Benefits

1. **Scalable** - Add new presets without updating every component
2. **Declarative** - Each preset declares its capabilities in one place
3. **Type-safe** - TypeScript ensures all capabilities are defined
4. **Maintainable** - Easy to see what each preset supports

## Adding New Presets

1. Add preset type to `src/lib/next/types/deck.ts`:
   ```typescript
   export type Preset = 'minimal' | 'trading' | 'newpreset';
   ```

2. Add capabilities to `presetCapabilities.ts`:
   ```typescript
   const PRESET_CAPABILITIES: Record<Preset, PresetCapabilities> = {
     // ... existing presets
     newpreset: {
       supportsTitle: true,
       supportsSubtitle: false,
       supportsDescription: true,
       supportsImage: true,
       supportsStats: false,
       supportsTraits: false,
       hasBackCard: false
     }
   };
   ```

3. Create preset component at `src/lib/next/components/card/CardPresetNewpreset.svelte`

4. Add to preset switcher in edit mode and deck viewer

## Examples

### Edit Mode
`src/routes/[slug]/edit/[cardId]/+page.svelte`

- Stats section only shows if `capabilities.supportsStats`
- Traits section only shows if `capabilities.supportsTraits`
- Back card preview only shows if `capabilities.hasBackCard`

### Future Use Cases

- Conditionally show/hide fields in card creation
- Validate data based on what preset supports
- Generate preset comparison tables
- Auto-hide irrelevant print settings
