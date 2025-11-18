# Type Errors To Fix

**Status as of:** Gallery migration and route cleanup
**Total Errors:** ~140 remaining (down from 152)
**Build Status:** ✅ Succeeds - these are TypeScript strict checking errors, not runtime errors

## ✅ Fixed (12 errors)
- **Merge Components** - Fixed `cardStats()` derived function calls in `ConflictSummary.svelte`

## 🔴 High Priority - Legacy AI Code (~118 errors)

**Location:** `src/lib/ai/` directory
**Root Cause:** Type conflicts between two Card type definitions:
- Legacy: `src/lib/types.ts`
- New: `src/lib/next/types/card.ts`

**Files affected:**
- `src/lib/ai/generators/image.ts`
- `src/lib/ai/imageGeneration.test.ts`
- `src/lib/ai/index.ts`

**Key Issues:**
1. Card type mismatches (missing `title`, `subtitle`, `description` properties)
2. Gemini API type issues (`aspectRatio` not in `GenerateContentConfig`)
3. `imageBlob: null` vs `imageBlob: undefined` type conflicts
4. Trait format mismatches (object vs string)

**Recommended Fix:**
- Option A: Update AI code to use new Card types from `src/lib/next/types/card.ts`
- Option B: Create adapter functions to convert between old and new types
- Option C: Mark as @ts-expect-error until full migration

## 🟠 Medium Priority - Type Definition Conflicts (~20 errors)

**Files affected:**
- `src/lib/next/utils/shareUrlConverter.ts` - Missing `imageStyle` in DeckMeta
- `src/lib/components/dialogs/ShareDialog.svelte` - `imageBlob` null/undefined mismatch
- `src/lib/components/dialogs/ShareDialog.svelte.test.ts` - Old vs new Card type conflicts

**Recommended Fix:**
- Standardize on single Card type definition
- Ensure all DeckMeta objects include `imageStyle`
- Update `imageBlob` type to be `Blob | null | undefined` consistently

## 🟡 Low Priority - Merge Component Issues (~10 errors)

**Files affected:**
- `src/lib/next/components/merge/CardConflicts.svelte`
- `src/lib/next/components/merge/MetaConflicts.svelte`

**Key Issues:**
1. Type narrowing issues with `never` type
2. String literal type mismatches (`'tags'` vs MetaField union)
3. Missing `Deck` export in deckMerging.ts

**Recommended Fix:**
- Add proper type narrowing/guards
- Export missing types from `deckMerging.ts`
- Update MetaField union to include all possible fields

## 📋 Action Plan

### Before Next Commit
- ✅ Fixed merge component derived function calls
- ✅ Documented all remaining errors in this file

### Phase 1: Quick Wins (Low hanging fruit)
1. Export missing `Deck` type from `deckMerging.ts`
2. Add `imageStyle` default value in `shareUrlConverter.ts`
3. Standardize `imageBlob` type to `Blob | null | undefined`

### Phase 2: AI Code Migration
1. Update AI generators to use new Card types
2. Create type adapters if needed
3. Update tests

### Phase 3: Full Type Unification
1. Deprecate `src/lib/types.ts` completely
2. Migrate all code to use `src/lib/next/types/*`
3. Delete legacy type definitions

## Notes

- Build succeeds despite these errors (they're TypeScript strict mode violations)
- Most errors are in legacy `/lib/ai/` and `/lib/components/` code
- New code in `/lib/next/` is mostly clean
- Priority should be unifying Card type definitions to prevent future issues
