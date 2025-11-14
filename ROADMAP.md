# Card Editor Development Roadmap

## 🎉 Current Status (Completed)

### ✅ Ultra-Compact Card Edit Dialog

- **Complete redesign** - No header, fieldset-style inputs, compact footer
- **Real card previews** - Uses actual Card components with live updates
- **Space efficient** - Both front/back cards visible without scrolling
- **Robust functionality** - Save/cancel/reset, layout toggle (poker/tarot)
- **Technical foundation** - Proper Svelte 5 reactive state, dialog system

### ✅ Core Infrastructure

- **Dialog system** - Reusable dialog with snippet-based content
- **Database layer** - Persistent storage with reactive updates
- **Card components** - Header, StatFocus, StatBlock, TraitList
- **Layout system** - Poker vs Tarot card arrangements

---

## 🚀 Phase 1: Stats Editor (HIGH PRIORITY - NEXT)

### 📋 Tasks

1. **Add Stats Fieldset to CardEditDialog**
   - [ ] Create "Stats" fieldset in edit form
   - [ ] List all existing stats with editable inputs
   - [ ] Support different input types (number, text, dropdown)
   - [ ] Add public/private toggle for each stat

2. **Stats Management UI**
   - [ ] "Add New Stat" button
   - [ ] Remove stat functionality (delete button per stat)
   - [ ] Reorder stats (up/down arrows or drag-drop)
   - [ ] Stat type selection (tracked vs static)

3. **Form Integration**
   - [ ] Wire stats formData to reactive state
   - [ ] Update previewCard to include live stat changes
   - [ ] Validation for numeric stats
   - [ ] Handle stat arrays properly in updates

4. **Live Preview Updates**
   - [ ] Ensure StatFocus (front) updates in real-time
   - [ ] Ensure StatBlock (back) updates in real-time
   - [ ] Test public/private stat visibility
   - [ ] Verify stat formatting and display

### 🎯 Success Criteria

- Click "Add Stat" and see new stat in preview immediately
- Edit stat values and see live updates in both card previews
- Toggle stat visibility and see it move between front/back
- Save changes and reload dialog - stats persist correctly

---

## 🏷️ Phase 2: Traits Editor (HIGH PRIORITY)

### 📋 Tasks

1. **Add Traits Fieldset to CardEditDialog**
   - [ ] Create "Traits" fieldset in edit form
   - [ ] List all existing traits with editable label/value pairs
   - [ ] Add public/private toggle per trait
   - [ ] Compact inline editing UI

2. **Traits Management UI**
   - [ ] "Add New Trait" button
   - [ ] Remove trait functionality
   - [ ] Reorder traits
   - [ ] Quick templates for common traits (Profession, Fear, etc.)

3. **Form Integration**
   - [ ] Wire traits formData to reactive state
   - [ ] Update previewCard to include live trait changes
   - [ ] Handle trait arrays properly in updates

4. **Live Preview Updates**
   - [ ] Public traits show on front card
   - [ ] Private traits show on back card
   - [ ] Proper trait formatting in TraitList component

---

## ✨ Phase 3: Polish & UX (MEDIUM PRIORITY)

### 📋 Tasks

1. **Keyboard Shortcuts**
   - [ ] Ctrl+S to save changes
   - [ ] Escape to cancel/close dialog
   - [ ] Tab navigation through all fields
   - [ ] Enter to add new stat/trait

2. **Enhanced Validation**
   - [ ] Field validation with helpful error messages
   - [ ] Required field indicators
   - [ ] Better loading states during save
   - [ ] Confirm dialog for unsaved changes

3. **Auto-save Draft**
   - [ ] Save draft changes to localStorage
   - [ ] Restore draft on dialog reopen
   - [ ] Clear draft on successful save
   - [ ] Prevent accidental data loss

4. **Responsive Improvements**
   - [ ] Better mobile layout for dialog
   - [ ] Touch-friendly buttons for mobile
   - [ ] Improved preview sizing on small screens

---

## 🔮 Phase 4: Advanced Features (FUTURE)

### 📋 Image Management

- [ ] Card artwork upload system
- [ ] Image positioning and scaling tools
- [ ] Crop and filter functionality
- [ ] Image library/gallery

### 📋 Templates & Presets

- [ ] Card type templates (Character, Item, Location, Spell)
- [ ] Pre-configured stat sets by card type
- [ ] Trait libraries and quick-add
- [ ] Duplicate card functionality

### 📋 Export & Sharing

- [ ] Export individual cards as images
- [ ] Print-ready PDF generation
- [ ] Share card designs via URL
- [ ] Import/export card JSON

### 📋 Advanced Editing

- [ ] Rich text editing for descriptions
- [ ] Markdown support
- [ ] Color themes and styling options
- [ ] Custom card layouts

---

## 🛠️ Technical Notes

### Current Architecture

- **Framework**: Svelte 5 with runes ($state, $derived, $effect)
- **Database**: IndexedDB with reactive store layer
- **Styling**: CSS with CSS custom properties
- **Components**: Modular card components (Header, StatFocus, etc.)

### Key Files

- `/src/routes/next/+page.svelte` - Main card view and dialog trigger
- `/src/lib/next/components/dialogs/CardEditDialog.svelte` - Edit dialog
- `/src/lib/next/stores/deckStore.svelte.ts` - Card data management
- `/src/lib/next/components/dialog/` - Dialog system
- `/src/lib/next/components/card/` - Card rendering components

### Development Workflow

1. Start dev server: `npm run dev`
2. Open: `http://localhost:5173/next`
3. Click any card to open edit dialog
4. Test changes in both card previews

### Next Session Quick Start

```bash
cd /Users/olemak/Projects/eksperimenter/char-cards
npm run dev
# Open browser to http://localhost:5173/next
# Click a card to test current dialog functionality
```

---

## 📝 Session Notes

### 2025-01-18 Session Accomplishments

- ✅ Completely redesigned CardEditDialog for ultra-compact layout
- ✅ Replaced mock previews with real Card components
- ✅ Fixed layout toggle and loading loop issues
- ✅ Implemented fieldset-style form inputs
- ✅ Added live preview updates for title, subtitle, description
- ✅ Cleaned up CSS and removed unused selectors
- ✅ Established solid foundation for stats/traits editing

### Ready for Next Session

**Primary Goal**: Implement Stats Editor in CardEditDialog
**Estimated Time**: 2-3 hours for full stats editing functionality
**Stretch Goal**: Begin Traits Editor if stats complete quickly
