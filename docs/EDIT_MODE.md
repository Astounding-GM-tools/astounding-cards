# Edit Mode - Full-Screen Card Editor

**Status:** Planned - Future enhancement
**Priority:** Medium - After Minimal preset
**Complexity:** Medium - New route with View Transitions

## Current System

**Edit Modal (Functional but Cramped):**
- Dialog overlay on deck page
- Contains all editing fields (title, subtitle, description, stats, traits, image)
- Works but feels cramped
- Good: Canon Update = instant saves
- Bad: Limited screen space, hard to see full context

**Access:** Click card → Edit dialog opens

---

## Proposed System: Dual-Mode Editing

### Mode 1: Edit Mode Route (Full Editor)
**Route:** `/[slug]/edit/[cardId]`

**When to use:**
- Creating new cards
- Major edits (multiple fields)
- Image generation/editing
- Working on multiple cards in sequence

**Features:**
- Full-screen editor
- Card list sidebar (switch between cards)
- Keyboard navigation (← → for prev/next card)
- View Transitions API (smooth card-to-card transitions)
- More space for AI features, image cropping, etc.

### Mode 2: Quick Edit Dialog (Simple Edits)
**Trigger:** Double-click specific field on card

**When to use:**
- Fix typo in title
- Change single field
- Quick adjustments
- Mobile users (less screen real estate anyway)

**Features:**
- Small focused dialog
- Edit just that field (title, subtitle, etc.)
- Save on blur/Enter
- ESC to cancel

---

## Edit Mode UI Design

### Layout
```
┌─────────────────────────────────────────────────────┐
│ [← Exit Edit Mode]              Editing Deck Name   │
├────────────────┬────────────────────────────────────┤
│ Card List      │  Full Editor                       │
│ (Sidebar)      │                                    │
│                │  ┌──────────────────────────────┐  │
│ ┌────────┐     │  │ Title: ____________         │  │
│ │Card 1  │ ←   │  │ Subtitle: __________        │  │
│ └────────┘     │  │                             │  │
│                │  │ Description:                │  │
│ ┌────────┐     │  │ ┌─────────────────────────┐ │  │
│ │Card 2  │     │  │ │                         │ │  │
│ └────────┘     │  │ │                         │ │  │
│                │  │ └─────────────────────────┘ │  │
│ ┌────────┐     │  │                             │  │
│ │Card 3  │     │  │ [Image]  [+ Generate AI]   │  │
│ └────────┘     │  │                             │  │
│                │  │ Stats:  [Add Stat]          │  │
│ [+ New Card]   │  │ Traits: [Add Trait]         │  │
│                │  │                             │  │
└────────────────┴──────────────────────────────────┘
```

### Navigation
- **Enter Edit Mode:** Action button on deck page → `/[slug]/edit/[cardId]`
- **Switch cards:** Click sidebar thumbnail → `/[slug]/edit/[newCardId]`
- **Keyboard:** `←` previous card, `→` next card, `Esc` exit edit mode
- **Exit Edit Mode:** "← Exit Edit Mode" button → `/[slug]`

---

## Route Structure

### New Routes
```typescript
/[slug]                     // View deck (read-only-ish)
/[slug]/edit                // Edit mode (first card)
/[slug]/edit/[cardId]       // Edit specific card
```

### Navigation Flow
```
View Deck Page (/[slug])
  │
  ├─ Click "Edit Mode" button → /[slug]/edit (first card)
  │
  └─ Double-click card field → Quick Edit Dialog (no navigation)

Edit Mode (/[slug]/edit/[cardId])
  │
  ├─ Click card in sidebar → /[slug]/edit/[otherCardId]
  ├─ Press ← or → → Navigate to prev/next card
  ├─ Click "Exit Edit Mode" → /[slug]
  └─ Press Esc → /[slug]
```

---

## View Transitions API

**Goal:** Make route transitions feel instant and smooth

### Implementation
```typescript
// In +layout.svelte
import { onNavigate } from '$app/navigation';

onNavigate((navigation) => {
  if (!document.startViewTransition) return;

  return new Promise((resolve) => {
    document.startViewTransition(async () => {
      resolve();
      await navigation.complete;
    });
  });
});
```

### CSS Transitions
```css
/* Smooth crossfade between routes */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
  animation-timing-function: ease-in-out;
}

/* Card-specific transitions */
.card {
  view-transition-name: var(--card-id);
}

/* Edit mode entry animation */
::view-transition-new(edit-mode) {
  animation: slideInFromRight 200ms ease-out;
}

@keyframes slideInFromRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

**Browser Support:**
- Chrome 111+ ✅
- Edge 111+ ✅
- Safari 18+ ✅
- Firefox: In development

**Fallback:** Instant navigation (no animation) on unsupported browsers

---

## Action Button Design

### On Deck Page
```svelte
<ActionButton onclick={handleEnterEditMode}>
  {#snippet icon()}<Edit size={20} />{/snippet}
  EDIT MODE
  Enter editor
</ActionButton>

<!-- Or toggle style: -->
<ActionButton
  variant={isEditMode ? 'primary' : 'secondary'}
  filled={isEditMode}
  onclick={toggleEditMode}
>
  {#snippet icon()}
    {#if isEditMode}
      <X size={20} />
    {:else}
      <Edit size={20} />
    {/if}
  {/snippet}
  {isEditMode ? 'EXIT EDIT' : 'EDIT MODE'}
  {isEditMode ? 'Back to view' : 'Enter editor'}
</ActionButton>
```

### Handlers
```typescript
function handleEnterEditMode() {
  // Navigate to first card in edit mode
  const firstCardId = deck.cards[0]?.id;
  if (firstCardId) {
    goto(`/${deck.id}/edit/${firstCardId}`);
  }
}

function toggleEditMode() {
  if (isEditMode) {
    goto(`/${deck.id}`); // Exit to view mode
  } else {
    handleEnterEditMode(); // Enter edit mode
  }
}
```

---

## Quick Edit Dialog (Future)

### Trigger
```svelte
<!-- On card preview -->
<div
  class="card-field"
  ondblclick={() => openQuickEdit('title', card.id)}
>
  {card.title}
</div>
```

### Dialog
```svelte
<dialog class="quick-edit-dialog">
  <label>
    Edit {fieldName}
    <input
      bind:value={editValue}
      onfocusout={handleSave}
      onkeydown={(e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
      }}
    />
  </label>
</dialog>
```

### Which Fields Support Quick Edit?
- ✅ Title (text input)
- ✅ Subtitle (text input)
- ✅ Description (textarea)
- ❌ Stats (too complex - use full editor)
- ❌ Traits (too complex - use full editor)
- ❌ Image (too complex - use full editor)

---

## Implementation Plan

### Phase 1: Basic Edit Mode Route (MVP)
**Goal:** Get away from cramped modal

**Tasks:**
1. Create `/[slug]/edit/[cardId]/+page.svelte`
2. Copy current edit form (from dialog)
3. Add card list sidebar
4. Add "Exit Edit Mode" button
5. Wire up navigation

**Acceptance criteria:**
- Can enter edit mode from deck page
- Can edit card fields (Canon Update saves)
- Can switch between cards
- Can exit back to deck view

**Time estimate:** 2-3 hours

---

### Phase 2: View Transitions
**Goal:** Smooth, delightful transitions

**Tasks:**
1. Implement `onNavigate` with `startViewTransition`
2. Add CSS animations
3. Test on supported browsers
4. Add feature detection fallback

**Acceptance criteria:**
- Card-to-card transitions are smooth
- Enter/exit edit mode feels polished
- Works gracefully on unsupported browsers

**Time estimate:** 1-2 hours

---

### Phase 3: Keyboard Navigation
**Goal:** Power user efficiency

**Tasks:**
1. Add keyboard event listeners
2. Implement ← → for prev/next card
3. Implement Esc for exit
4. Add visual keyboard hints

**Acceptance criteria:**
- ← navigates to previous card
- → navigates to next card
- Esc exits edit mode
- Keyboard shortcuts shown in UI

**Time estimate:** 1 hour

---

### Phase 4: Quick Edit Dialog (Future)
**Goal:** Fast edits without leaving view mode

**Tasks:**
1. Add double-click handlers to card fields
2. Create minimal edit dialog component
3. Implement field-specific editors
4. Add save/cancel logic

**Acceptance criteria:**
- Double-click title opens quick edit
- Edit saves on blur or Enter
- Esc cancels edit
- Works on mobile (tap-and-hold?)

**Time estimate:** 2-3 hours

---

## Open Questions

### 1. Card List Sidebar
**Q:** Always visible, or collapsible on small screens?
**Options:**
- Always visible (desktop), slide-over drawer (mobile)
- Collapsible hamburger menu
- Bottom sheet on mobile (like mobile apps)

### 2. Unsaved Changes
**Q:** Even with Canon Update, user might be mid-typing. Show warning?
**Options:**
- No warning (trust Canon Update)
- Soft warning: "Changes auto-saved" toast
- Block navigation while typing (debounced)

### 3. Mobile Experience
**Q:** How does edit mode work on phones?
**Options:**
- Full screen (no sidebar)
- Swipe left/right for prev/next card
- Card selector dropdown instead of sidebar

### 4. Breadcrumbs
**Q:** Show navigation path?
**Options:**
- `Deck Name > Edit > Card 3 of 12`
- Just "← Exit Edit Mode"
- Breadcrumb trail for deep navigation

---

## Success Metrics

**How we'll know it's working:**

1. **User satisfaction**
   - Less complaints about cramped editing
   - Users spend more time in edit mode
   - Positive feedback about spacious layout

2. **Efficiency**
   - Faster card creation (more space = easier workflow)
   - Less navigation back-and-forth
   - Keyboard shortcuts usage

3. **Adoption**
   - % of users who discover edit mode
   - Avg time spent in edit mode per session
   - Cards created per session increases

4. **Technical**
   - View Transitions adoption rate (browser support)
   - No increase in "lost edits" (Canon Update reliability)
   - Page load times remain fast

---

## Future Enhancements

### Beyond MVP
1. **Multi-select edit** - Edit multiple cards at once
2. **Bulk operations** - Apply trait/stat to all cards
3. **Card templates** - Save card as template for new cards
4. **History/undo** - Visual undo/redo for edits
5. **Collaborative editing** - Real-time multi-user (aspirational!)
6. **AI assist panel** - Persistent AI helper in sidebar
7. **Preview mode** - Toggle between edit and preview in same view

---

## Design Principles

**Keep in mind when implementing:**

1. **Canon Update is magic** - Don't add fake "Save" buttons
2. **Keyboard shortcuts** - Power users will love them
3. **Progressive enhancement** - Basic version works everywhere, fancy features enhance
4. **Mobile-first thinking** - Small screens need different UX
5. **Joy in details** - Smooth transitions, helpful tooltips, delightful micro-interactions

---

## Resources

### View Transitions API
- [MDN: View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Chrome Developers: Smooth transitions](https://developer.chrome.com/docs/web-platform/view-transitions/)
- [SvelteKit + View Transitions](https://kit.svelte.dev/docs/modules#$app-navigation-onnavigate)

### Design Inspiration
- [Notion](https://notion.so) - Full-page editor with sidebar
- [Figma](https://figma.com) - Properties panel + canvas
- [Obsidian](https://obsidian.md) - File list + editor split view

### Code Examples
- [SvelteKit transitions demo](https://github.com/sveltejs/kit/tree/master/examples/view-transitions)
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)

---

Last updated: 2025-12-08
Status: Planned, not implemented
Next step: Implement after Minimal Preset
