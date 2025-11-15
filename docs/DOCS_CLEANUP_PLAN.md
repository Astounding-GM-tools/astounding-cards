# Documentation Cleanup Plan

**Date**: November 15, 2025  
**Goal**: Remove outdated/redundant docs, consolidate useful information

---

## 🗑️ DELETE - Completed/Obsolete

### MIGRATION_PLAN.md
- **Status**: Character→Card migration COMPLETE
- **Action**: DELETE
- **Reason**: Migration finished, all terminology updated

### CLEANUP_SUMMARY.md
- **Status**: Historical record from August 2025
- **Action**: DELETE  
- **Reason**: Canon Update pattern cleanup is done and documented elsewhere

### CLEANUP_AND_NEXT_STEPS.md
- **Status**: Dated August 12, 2025 - outdated action items
- **Action**: DELETE
- **Reason**: Next steps completed or superseded by current ROADMAP

### DISABLED_TESTS.md
- **Status**: MVP launch focus from August 15, 2025
- **Action**: **REVIEW FIRST** - Check if tests still disabled
- **If tests re-enabled**: DELETE
- **If tests still disabled**: Keep but update date

### deck-level-statblock-configs.md
- **Status**: Design doc for vocabulary system
- **Action**: **CHECK IMPLEMENTATION**
- **If implemented**: DELETE (documented in code)
- **If not implemented**: Keep as future reference

---

## 📦 MERGE/CONSOLIDATE

### DEV_TOOLS_SUMMARY.md → E2E_TEST_PATTERNS.md
- **Useful content**:
  - Console shortcuts reference (`window.e2eHelpers`)
  - DevToolsHelper class methods
  - Sample data structure ("Tales of the Uncanny")
  - Usage examples
- **Action**: 
  1. Add console shortcuts reference to E2E_TEST_PATTERNS.md
  2. Add DevToolsHelper method reference
  3. DELETE DEV_TOOLS_SUMMARY.md

### REFACTORING_CHECKLIST.md
- **Status**: Component refactoring tracking
- **Action**: **CHECK CURRENT STATUS**
- **If all refactoring complete**: DELETE
- **If ongoing**: Update status and keep

### LOGIC_EXTRACTION_ROADMAP.md
- **Status**: Detailed extraction methodology and component status
- **Useful content**:
  - Proven methodology (Steps 1-5)
  - Quality standards
- **Action**:
  1. Move methodology to DEVELOPMENT_METHODOLOGY.md
  2. Move completed component status to ROADMAP.md
  3. DELETE LOGIC_EXTRACTION_ROADMAP.md

---

## ✅ KEEP - Current/Reference

### Core Documentation
- ✅ **ARCHITECTURE.md** - System architecture
- ✅ **CANON_UPDATE_PATTERN.md** - State management pattern
- ✅ **DEVELOPMENT_METHODOLOGY.md** - Development practices
- ✅ **DEVELOPMENT_RULES.md** - Svelte 5 standards
- ✅ **E2E_TEST_PATTERNS.md** - Testing patterns
- ✅ **ROADMAP.md** - Current roadmap
- ✅ **USAGE.md** - User guide

### Phase/Planning
- ✅ **PHASE_1B_PLAN.md** - Current phase work
- ✅ **MONETIZATION_PLAN.md** - Future monetization strategy

### AI/Prompt Reference
- ✅ **AI_GENERATION_GUIDELINES.md** - AI generation rules
- ✅ **DECK_EXAMPLES.md** - Deck diversity examples
- ✅ **DECK_PROMPTS_COLLECTION.md** - Ready-to-use prompts
- ✅ **PROMPTS_READY_TO_PASTE.md** - Quick prompts
- ✅ **IMAGE_GENERATION_EXAMPLES.md** - Image style examples

---

## 📝 ACTION ITEMS

### Immediate (Tonight)

1. ✅ **DELETE**: IMAGE_HOSTING.md (already done)

2. **MERGE DEV_TOOLS_SUMMARY into E2E_TEST_PATTERNS**:
   - Add section "Console Shortcuts Reference"
   - Add section "DevToolsHelper API"
   - Add section "Sample Test Data"
   - DELETE DEV_TOOLS_SUMMARY.md

3. **CHECK & DELETE**:
   - MIGRATION_PLAN.md (if migration complete)
   - CLEANUP_SUMMARY.md
   - CLEANUP_AND_NEXT_STEPS.md

### Review Required

4. **DISABLED_TESTS.md**:
   - Check current test status
   - Update or delete accordingly

5. **deck-level-statblock-configs.md**:
   - Verify if vocabulary system implemented
   - Keep or archive accordingly

6. **REFACTORING_CHECKLIST.md**:
   - Check if refactoring complete
   - Update status or archive

7. **LOGIC_EXTRACTION_ROADMAP.md**:
   - Extract methodology to DEVELOPMENT_METHODOLOGY
   - Move status to ROADMAP
   - Delete original

---

## 📊 Expected Results

**Before**: 23 MD files  
**After**: ~13-15 MD files (43% reduction)

**Benefits**:
- Clearer documentation structure
- No outdated/conflicting information
- Easier for new contributors to find relevant docs
- Consolidated testing knowledge

---

## 🔍 Verification Checklist

After cleanup, verify:
- [ ] All current features documented
- [ ] No broken internal doc links
- [ ] README.md links still valid
- [ ] WARP.md references updated if needed
- [ ] No duplicate information across files
