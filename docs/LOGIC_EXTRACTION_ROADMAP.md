# 🚀 Logic Extraction Roadmap - Tony Stark Edition

*"Sometimes you gotta run before you can walk." - Tony Stark*

## 🎯 **Mission: Extract ALL component logic for warp speed development**

### **Progress Tracker:**
- ✅ **StatblockVocabularyEditor** - COMPLETE (35 tests, 6ms execution) 
- ✅ **DeckManager** - COMPLETE (78 tests, 19ms execution)
- ✅ **CardStatsEditor** - COMPLETE (86 tests, 16ms execution)
- ✅ **CardFront** - COMPLETE (46 tests, 4ms execution)
- 🚧 **CardBack Component** - NEXT UP
- ⏳ **Other CardEditor Components** - QUEUED  
- ⏳ **Store Logic** - QUEUED
- ⏳ **Shared Utilities** - QUEUED

---

## 📋 **High-Impact Extraction Targets**

### 🏆 **Tier 1: Core Business Logic (Maximum Impact)**

#### ✅ StatblockVocabularyEditor *(COMPLETED)*
- **Logic File:** `StatblockVocabularyEditor.svelte.ts`
- **Tests:** 35 comprehensive tests
- **Speed:** 5ms execution time
- **Functions:** 9 pure functions with full coverage

#### ✅ DeckManager *(COMPLETED)*
- **Logic File:** `DeckManager.svelte.ts`
- **Tests:** 78 comprehensive tests  
- **Speed:** 19ms execution time
- **Functions:** 26 pure functions with full coverage
- **Extracted Logic:**
  - Card selection and bulk operations
  - Deck name validation and duplication
  - Theme change parameter creation
  - Copy/delete operation validation
  - Message formatting and date utilities
  - State management helpers
  - Vocabulary validation
- **Impact:** Central to app, now fully testable and refactorable

#### ✅ CardStatsEditor *(COMPLETED)*
- **Logic File:** `CardStatsEditor.svelte.ts`
- **Tests:** 86 comprehensive tests
- **Speed:** 16ms execution time
- **Functions:** 25+ pure functions with full coverage
- **Extracted Logic:**
  - Stat addition/removal/reordering with drag & drop
  - State management and validation
  - Custom stat creation and management
  - Stat definition lookups and grouping
  - Sorting and summary calculations
- **Impact:** Core gameplay feature now fully testable

### 🎮 **Tier 2: Card Management Logic**

#### ✅ CardFront *(COMPLETED)*
- **Logic File:** `CardFront.svelte.ts`
- **Tests:** 46 comprehensive tests
- **Speed:** 4ms execution time
- **Functions:** 15 pure functions with full coverage
- **Extracted Logic:**
  - Theme resolution and image URL management
  - Image state management and CSS generation
  - Content validation for names and roles
  - Button text/title generation
  - UI state helpers and flourish visibility
- **Impact:** Clean separation of rendering logic and UI state

#### ⏳ CardBack Component
- **Logic Opportunities:**
  - Content validation and template application
  - Theme resolution and mechanics handling
  - Template instantiation logic
  - Content formatting helpers
- **Expected Functions:** ~8-10 functions

#### ⏳ CardEditor Components  
- **Logic Opportunities:**
  - Form state management
  - Field validation
  - Auto-save logic
  - Undo/redo functionality
- **Expected Functions:** ~5-7 functions

### 🔧 **Tier 3: Store Logic Enhancement**

#### ⏳ Deck Store (`src/lib/stores/deck.ts`)
- **Current State:** Already logic-heavy, needs testing
- **Opportunities:**
  - Add comprehensive test coverage
  - Extract pure functions for easier testing
  - Simplify complex async operations
- **Expected Tests:** ~25-30 tests

#### ⏳ StatblockConfig Store  
- **Opportunities:**
  - Configuration management
  - Template loading and caching
  - Validation and error handling
- **Expected Functions:** ~8-10 functions

### 🛠️ **Tier 4: Shared Utilities Discovery**

*As we extract, we'll identify common patterns for:*

#### ⏳ Common Operations
- **deck-operations.ts** - Shared deck manipulation
- **card-operations.ts** - Card state management
- **validation-utils.ts** - Reusable validation logic
- **state-transforms.ts** - Immutable state helpers
- **url-utils.ts** - Sharing and import/export logic

---

## 📊 **Success Metrics**

### **Speed Indicators:**
- [ ] Unit test runtime < 50ms total for all extracted logic
- [ ] Individual test files < 10ms execution time
- [ ] Development feedback loop < 1 second

### **Quality Indicators:**
- [ ] 100% function coverage for all `.svelte.ts` files
- [ ] Edge cases covered (error states, boundary conditions)
- [ ] Immutable state patterns enforced
- [ ] TypeScript strict mode compliance

### **Developer Experience:**
- [ ] Fearless refactoring confidence
- [ ] Faster feature development cycles
- [ ] Easier debugging and testing
- [ ] Clear separation of concerns

---

## 🎯 **Current Focus: CardBack Component**

### **Today's Mission:**
1. **Analyze** CardBack component for extractable logic
2. **Create** CardBack.svelte.ts with pure functions
3. **Test** all functions with comprehensive coverage
4. **Integrate** back into component
5. **Identify** common patterns for shared utilities

### **Expected Outcomes:**
- **~8-10 pure functions** with full test coverage
- **Sub-10ms test execution** time
- **Cleaner component** focused on presentation
- **Reusable template and content logic** for other components

---

## 🌟 **The Vision**

By the end of this roadmap:
- **Every component** has extracted, tested logic
- **Development speed** increased by 5-10x
- **Bug rate** dramatically reduced
- **Refactoring confidence** at 100%
- **Shared utilities** eliminate code duplication

**"I am inevitable... at shipping features fast."** ⚡🚀

---

*Last Updated: Completed CardFront extraction (46 tests), moving to CardBack*
