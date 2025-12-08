# Deck Presets - Card Layout Templates

**Status:** In Progress - Next priority feature
**Priority:** High - Core UX improvement
**Complexity:** Medium - New component architecture + settings UI

## Overview

Deck Presets are layout templates that determine which card fields are displayed and how they're arranged. Different presets suit different use cases (detailed RPG cards vs. simple flash cards).

## Presets

### 1. Trading Card (Default)
**Use cases:** RPG characters, detailed game cards, complex profiles

**Front displays:**
- Title
- Subtitle
- Description
- Image
- Stats (all)
- Traits (all)

**Back displays:**
- Full card back content
- Detailed information

**Example:** D&D character sheet, Magic: The Gathering creature card

---

### 2. Minimal (NEW)
**Use cases:** Flash cards, quiz cards, cue cards, simple prompts

**Front displays:**
- Title (large, prominent)
- Subtitle (if present)
- Image (if present)
- **No stats, no traits, no description**

**Back displays:**
- Description only (if two-sided printing enabled)
- Clean, minimal design

**Example:** Cards Against Humanity, flash cards, presentation cue cards

**Design notes:**
- Based on `CardFrontSpotlight.svelte` (started but not finished)
- Image first (if present), then title, then subtitle
- Large text, lots of whitespace
- Focus on readability

---

### 3. Future Presets (Ideas)

**Stat Focus:**
- Emphasize stats over traits
- Good for: Combat cards, equipment cards

**Trait Focus:**
- Emphasize traits/abilities over stats
- Good for: Spell cards, ability cards

**Minimal Stats:**
- Like Trading but with fewer stats shown
- Good for: Simplified character sheets

**Image Hero:**
- Full-bleed image with minimal text overlay
- Good for: Art cards, tarot-style decks

---

## Data Model

### Type Definition

```typescript
// In src/lib/next/types/deck.ts

export type Preset = 'minimal' | 'trading';

interface DeckMeta {
  title: string;
  description?: string;
  theme: Theme;
  imageStyle: ImageStyle;
  layout: Layout; // 'poker' | 'tarot'
  preset?: Preset; // NEW - defaults to 'trading'
  lastEdited: number;
  createdAt: number;
  // ... other fields
}
```

### Default Behavior

- **Existing decks:** No `preset` field → default to `'trading'`
- **New decks:** Default to `'trading'` (familiar behavior)
- **User choice:** Can change via Deck Settings panel

---

## Component Architecture

### Current System
```
CardPreview.svelte
  ├─ CardFront.svelte (shows everything)
  └─ CardBack.svelte (shows back content)
```

### New System (Preset-Aware)
```
CardPreview.svelte (switcher component)
  ├─ if preset === 'minimal':
  │   ├─ CardPresetMinimal.svelte
  │   │   ├─ MinimalFront.svelte (image, title, subtitle)
  │   │   └─ MinimalBack.svelte (description only)
  │
  └─ if preset === 'trading':
      ├─ CardPresetTrading.svelte
      │   ├─ TradingFront.svelte (current CardFront)
      │   └─ TradingBack.svelte (current CardBack)
```

### File Structure
```
src/lib/next/components/card/
├── CardPreview.svelte           # Switcher (checks deck.meta.preset)
├── CardPresetMinimal.svelte     # NEW - Minimal preset
├── CardPresetTrading.svelte     # Refactored - Current cards
├── CardFront.svelte             # DEPRECATED - Move to Trading
├── CardBack.svelte              # DEPRECATED - Move to Trading
└── CardFrontSpotlight.svelte    # UNFINISHED - Basis for Minimal
```

---

## Implementation Plan

### Step 1: Update Types ✅
**File:** `src/lib/next/types/deck.ts`

```typescript
export type Preset = 'minimal' | 'trading';

interface DeckMeta {
  // ... existing fields
  preset?: Preset; // NEW
}
```

**Migration:** No migration needed, defaults to `'trading'`

---

### Step 2: Create CardPresetMinimal.svelte ✅
**File:** `src/lib/next/components/card/CardPresetMinimal.svelte`

**Props:**
```typescript
interface Props {
  card: Card;
  showBack?: boolean;
  onClick?: (cardId: string) => void;
}
```

**Layout:**
```svelte
<div class="card-preset-minimal">
  {#if showBack}
    <!-- Back: Description only -->
    <div class="minimal-back">
      {#if card.description}
        <p class="description">{card.description}</p>
      {:else}
        <div class="placeholder">No description</div>
      {/if}
    </div>
  {:else}
    <!-- Front: Image, Title, Subtitle -->
    <div class="minimal-front">
      {#if card.image}
        <img src={card.image} alt={card.title} class="hero-image" />
      {/if}

      <h2 class="title">{card.title || 'Untitled'}</h2>

      {#if card.subtitle}
        <p class="subtitle">{card.subtitle}</p>
      {/if}
    </div>
  {/if}
</div>
```

**Styling:**
- Large, readable fonts
- Lots of whitespace
- Image fills available space (if present)
- Title: 2-3rem font size
- Subtitle: 1-1.5rem, lighter weight
- No borders/decorations (minimal!)

---

### Step 3: Create CardPresetTrading.svelte ✅
**File:** `src/lib/next/components/card/CardPresetTrading.svelte`

**Action:** Move existing `CardFront.svelte` + `CardBack.svelte` logic here

**Props:**
```typescript
interface Props {
  card: Card;
  showBack?: boolean;
  onClick?: (cardId: string) => void;
}
```

**Layout:** Keep current behavior (all fields shown)

---

### Step 4: Update CardPreview.svelte (Switcher) ✅
**File:** `src/lib/next/components/card/CardPreview.svelte`

**Logic:**
```svelte
<script lang="ts">
  import CardPresetMinimal from './CardPresetMinimal.svelte';
  import CardPresetTrading from './CardPresetTrading.svelte';
  import type { Card } from '$lib/next/types/card';
  import type { Preset } from '$lib/next/types/deck';

  interface Props {
    card: Card;
    preset?: Preset; // From deck.meta.preset
    showBack?: boolean;
    onClick?: (cardId: string) => void;
  }

  let { card, preset = 'trading', showBack, onClick }: Props = $props();
</script>

{#if preset === 'minimal'}
  <CardPresetMinimal {card} {showBack} {onClick} />
{:else}
  <CardPresetTrading {card} {showBack} {onClick} />
{/if}
```

**Update all usages:**
```svelte
<!-- Before -->
<CardPreview {card} />

<!-- After -->
<CardPreview {card} preset={deck.meta.preset} />
```

---

### Step 5: Add Deck Settings Panel ✅
**File:** `src/lib/next/components/settings/DeckSettingsPanel.svelte` (NEW)

**Location:** On deck page, as expandable accordion

**Trigger:** Action button (last in row)
```svelte
<ActionButton onclick={toggleSettings}>
  {#snippet icon()}<Settings size={20} />{/snippet}
  DECK SETTINGS
  Configure deck
</ActionButton>
```

**Settings included:**

#### A. Print Size
```
○ Small (9 cards per page)
○ Large (4 cards per page)

┌─────────────┐
│ ▢ ▢ ▢      │  ← Visual preview
│ ▢ ▢ ▢      │
│ ▢ ▢ ▢      │
└─────────────┘
Small (9/page)
```

Maps to: `deck.meta.layout` ('poker' | 'tarot')

#### B. Card Backs
```
○ None (fronts only)
○ Content (show back side)
```

Maps to: Print settings (not stored in deck meta currently)

#### C. Preset
```
○ Minimal (clean, simple)
○ Trading Card (detailed)
```

Maps to: `deck.meta.preset`

#### D. Theme (Future)
```
[Dropdown: Classic, Medieval, Cyberpunk, etc.]
```

Maps to: `deck.meta.theme` (already exists)

**Layout:**
```svelte
<div class="deck-settings-panel" class:expanded={isExpanded}>
  <div class="settings-grid">
    <!-- Print Size -->
    <fieldset>
      <legend>Print Size</legend>
      <label>
        <input type="radio" name="layout" value="poker" bind:group={layout} />
        <div class="option">
          <span class="label">Small</span>
          <span class="description">9 cards per page</span>
          <div class="preview preview-small"></div>
        </div>
      </label>
      <label>
        <input type="radio" name="layout" value="tarot" bind:group={layout} />
        <div class="option">
          <span class="label">Large</span>
          <span class="description">4 cards per page</span>
          <div class="preview preview-large"></div>
        </div>
      </label>
    </fieldset>

    <!-- Preset -->
    <fieldset>
      <legend>Preset</legend>
      <label>
        <input type="radio" name="preset" value="minimal" bind:group={preset} />
        <div class="option">
          <span class="label">Minimal</span>
          <span class="description">Clean & simple</span>
        </div>
      </label>
      <label>
        <input type="radio" name="preset" value="trading" bind:group={preset} />
        <div class="option">
          <span class="label">Trading Card</span>
          <span class="description">Detailed profile</span>
        </div>
      </label>
    </fieldset>

    <!-- Card Backs (future) -->
    <!-- Theme (future) -->
  </div>
</div>
```

**Canon Update integration:**
```typescript
// When user changes setting
$: if (preset !== deck.meta.preset) {
  updateDeckMeta({ preset });
}

$: if (layout !== deck.meta.layout) {
  updateDeckMeta({ layout });
}

async function updateDeckMeta(updates: Partial<DeckMeta>) {
  await nextDeckStore.updateDeckMeta(updates);
  toasts.success('Settings updated');
}
```

---

### Step 6: Wire Up Settings Panel ✅
**File:** `src/routes/[slug]/+page.svelte`

**Add action button:**
```svelte
<ActionBar>
  <!-- ... existing buttons ... -->

  <!-- Settings - LAST button in row -->
  <ActionButton onclick={toggleSettings} variant="secondary">
    {#snippet icon()}<Settings size={20} />{/snippet}
    DECK SETTINGS
    Configure deck
  </ActionButton>
</ActionBar>

<!-- Settings panel (expandable) -->
{#if showSettings}
  <DeckSettingsPanel
    deck={activeDeck}
    onClose={() => showSettings = false}
  />
{/if}
```

---

### Step 7: Update Print Layout ✅
**File:** `src/lib/next/components/print/PrintLayout.svelte`

**Pass preset to CardPreview:**
```svelte
{#each deck.cards as card}
  <CardPreview
    {card}
    preset={deck.meta.preset}
    showBack={false}
  />
{/each}

<!-- Card backs -->
{#if showCardBacks}
  {#each deck.cards as card}
    <CardPreview
      {card}
      preset={deck.meta.preset}
      showBack={true}
    />
  {/each}
{/if}
```

---

## Testing Checklist

### Functionality
- [ ] New decks default to 'trading' preset
- [ ] Existing decks default to 'trading' preset
- [ ] Can switch from trading → minimal
- [ ] Can switch from minimal → trading
- [ ] Preset persists after page reload
- [ ] Preset updates via Canon Update (instant)
- [ ] Print layout respects preset
- [ ] Published decks include preset field

### Visual
- [ ] Minimal front: Image, title, subtitle only
- [ ] Minimal back: Description only
- [ ] Trading: All fields shown (current behavior)
- [ ] Settings panel expands smoothly
- [ ] Radio buttons work correctly
- [ ] Preview icons are clear

### Edge Cases
- [ ] Card with no image (minimal preset)
- [ ] Card with no description (minimal back)
- [ ] Card with no title (fallback to "Untitled")
- [ ] Deck with no cards (settings still accessible)
- [ ] Switching preset mid-edit session

---

## User Experience

### Discovery
**How users learn about presets:**
1. New user creates first deck → sees "DECK SETTINGS" button
2. Clicks settings → sees preset options with descriptions
3. Tries switching → sees immediate preview update
4. "Aha!" moment: Different presets for different needs

### Workflow
**Typical usage:**
```
1. User creates deck for flash cards
2. Adds cards with title + description
3. Opens Deck Settings
4. Selects "Minimal" preset
5. Preview updates → clean, simple cards
6. Prints → perfect for studying!
```

---

## Future Enhancements

### Preset-Specific Themes
- Minimal preset → Minimal theme variations (fonts, colors)
- Trading preset → Rich themes (medieval, cyberpunk, etc.)

### Custom Presets
- User creates custom preset (advanced)
- Choose which fields to show/hide
- Save as template for future decks

### Preset Recommendations
- AI suggests preset based on card content
- "Looks like flash cards → Try Minimal preset"

### Preset Preview
- Show side-by-side comparison before switching
- "Preview Minimal" button → temporary view

---

## Migration Strategy

### Existing Decks
**No migration needed!**
- Decks without `preset` field → defaults to `'trading'`
- Behavior unchanged (all fields still shown)
- User can opt-in to Minimal when ready

### Published Decks
**Preset included in share data:**
- URL-shared decks include `?preset=minimal`
- Imported decks preserve preset choice
- Remixed decks can change preset

---

## Success Metrics

### Adoption
- % of decks using Minimal preset
- % of decks switching presets
- Time to first preset change

### User Satisfaction
- Feedback on settings panel UX
- Complaints about cramped cards (should decrease)
- Print quality satisfaction

### Technical
- Performance: Preset switching speed
- No regressions in print layout
- Canon Update reliability with new field

---

## Open Questions

### 1. Default Preset for New Decks
**Options:**
- A) Always 'trading' (familiar)
- B) Ask user on deck creation
- C) Smart default based on first card content

**Decision:** Start with A, consider B/C later

### 2. Preset Switching Warning
**Q:** Warn user when switching to Minimal (hides stats/traits)?
**Options:**
- A) No warning (reversible, Canon Update saves)
- B) Toast: "Stats/traits hidden in Minimal preset"
- C) Confirmation dialog

**Decision:** B (soft warning)

### 3. Per-Card Preset Override
**Q:** Allow individual cards to use different presets?
**Options:**
- A) No, preset is deck-level only
- B) Yes, card-level override (complex!)

**Decision:** A for now

---

## Resources

### Design References
- [Cards Against Humanity](https://cardsagainsthumanity.com/) - Minimal style
- [Magic: The Gathering](https://magic.wizards.com/) - Trading card style
- [Anki Flash Cards](https://apps.ankiweb.net/) - Simple front/back

### Code Examples
- Current: `src/lib/next/components/card/CardFront.svelte`
- Started: `src/lib/next/components/card/CardFrontSpotlight.svelte`
- Reference: `src/lib/next/components/print/PrintLayout.svelte`

---

Last updated: 2025-12-08
Status: Ready to implement
Next step: Add preset field to DeckMeta type
