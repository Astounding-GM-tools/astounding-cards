# Pure Logic Extraction Roadmap & Methodology

## 🎯 Project Goal
Extract pure, testable logic from Svelte components to improve code maintainability, testability, and separation of concerns.

## 🔬 **Proven Methodology** (Refined through experience)

### **Step 1: ANALYZE FIRST** ⚠️ CRITICAL
**Before extracting anything, analyze what logic the component actually uses:**

1. **Read the entire component file** (`Component.svelte`)
2. **Identify actual functions/logic used** in:
   - Event handlers (onClick, onBlur, etc.)
   - Derived values (`$derived()`)
   - Effect blocks (`$effect()`) 
   - Inline expressions in template
   - Reactive statements
3. **Map usage to line numbers** for reference
4. **Distinguish between**:
   - ✅ **Used logic**: Functions/calculations actually called
   - ❌ **Potential logic**: Things that "could" be extracted but aren't used

### **Step 2: EXTRACT ONLY USED LOGIC**
Create `Component.svelte.ts` with only functions that are **actually used**:

1. **Pure functions** - no side effects, predictable outputs
2. **Validation functions** - if component does client-side validation
3. **Data transformation** - processing user input, API responses
4. **State helpers** - if complex state logic exists
5. **Utility functions** - commonly reused calculations

**❌ DON'T EXTRACT:**
- Functions for simple inline logic (`editable && !isUpdating`)
- Over-engineered state management for simple `$state` variables
- Validation functions if component doesn't do client-side validation
- Speculative "might be useful" functions

### **Step 3: CREATE FOCUSED TESTS**
Create `Component.svelte.test.ts` with **only tests for extracted functions**:

1. **Test every extracted function thoroughly**
2. **Cover edge cases and error conditions**
3. **Verify pure function behavior** (same input = same output)
4. **Mock external dependencies** properly

**Typical test count**: 10-40 tests per component (depending on complexity)

### **Step 4: INTEGRATION VERIFICATION**
Create `Component.component.test.ts` to verify integration:

1. **Import test** - verify all functions can be imported without errors
2. **Type test** - verify component props/types work correctly
3. **Basic instantiation** - ensure component can be created

### **Step 5: UPDATE COMPONENT** (If beneficial)
**Optionally** update the component to use extracted functions:

1. **Import extracted functions** at the top
2. **Replace inline logic** with function calls where it improves readability
3. **Keep simple logic inline** - don't over-engineer

---

## 📊 **Current Status**

### ✅ **COMPLETED COMPONENTS** (Methodology Validated)

| Component | Status | Logic File | Tests | Integration | Notes |
|-----------|---------|------------|--------|-------------|--------|
| **CardFront** | ✅ Complete | `CardFront.svelte.ts` | 42 tests ✅ | 2 tests ✅ | All extracted functions in use |
| **CardStatsEditor** | ✅ Complete | `CardStatsEditor.svelte.ts` | 55 tests ✅ | 2 tests ✅ | All extracted functions in use |
| **CardBack** | ✅ Complete | `CardBack.svelte.ts` | 38 tests ✅ | 2 tests ✅ | **Clean extraction** - only used functions |
| **CardMechanicsDisplay** | ✅ Complete | `CardMechanicsDisplay.svelte.ts` | 32 tests ✅ | 2 tests ✅ | **Perfect methodology** - 5/5 functions used |
| **CardMechanicsEditor** | ✅ Complete | `CardMechanicsEditor.svelte.ts` | 54 tests ✅ | 2 tests ✅ | **Comprehensive** - 11 functions + Playwright tests |

**Total: 221 pure logic tests + 10 integration tests = 231 tests**

### 🔄 **NEXT COMPONENTS** (Priority order)

| Component | Priority | Complexity | Estimated Logic Functions |
|-----------|----------|------------|----------------------------|
| **StatblockTemplateDialog** | HIGH | High | ~15-25 functions |
| **ImageSelector** | MEDIUM | Medium | ~8-15 functions |
| **CardBase** | LOW | Low | ~5-10 functions |

**Note**: CardMechanicsDialog was analyzed and found to be a simple wrapper (~8 lines of logic) around CardMechanicsEditor, so extraction is not needed.

### 🎯 **NEXT SESSION PLAN**

1. **Analyze StatblockTemplateDialog** (45 minutes)
   - Read component thoroughly - likely most complex remaining component
   - Map template selection, filtering, preview logic
   - Plan extraction strategy for complex form handling and validation

2. **Extract & Test StatblockTemplateDialog** (90 minutes)
   - Complex component with template management, filtering, data transformation
   - Likely ~15-25 functions covering template processing and UI logic
   - Comprehensive test suite for all template operations

3. **Analyze ImageSelector** (30 minutes)
   - Read component for file upload, validation, and preview logic
   - Plan extraction for image processing utilities

---

## 🧪 **Quality Standards**

### **Code Quality**
- ✅ **Pure functions only** - no side effects
- ✅ **TypeScript strict mode** - full type safety  
- ✅ **Comprehensive JSDoc** - document parameters and return values
- ✅ **Consistent naming** - clear, descriptive function names
- ✅ **Single responsibility** - each function does one thing well

### **Test Quality**  
- ✅ **100% coverage** of extracted functions
- ✅ **Edge case testing** - null, undefined, empty values, boundaries
- ✅ **Error condition testing** - invalid inputs, failure scenarios
- ✅ **Pure function verification** - same inputs produce same outputs
- ✅ **No external dependencies** in pure functions (or properly mocked)

### **Integration Quality**
- ✅ **Import verification** - all functions can be imported
- ✅ **Type compatibility** - component types work correctly
- ✅ **No breaking changes** - component still functions correctly

---

## 📈 **Success Metrics**

### **Quantitative**
- **Test Coverage**: >90% of extracted pure logic
- **Test Count**: ~25-40 tests per medium complexity component
- **Function Utilization**: 100% of extracted functions should be used
- **Integration Success**: 0 import errors, 0 type errors

### **Qualitative** 
- **Maintainability**: Logic is easier to test and modify in isolation
- **Reusability**: Pure functions can be reused across components
- **Debugging**: Easier to debug pure functions vs component logic
- **Documentation**: Logic behavior is clearly documented and tested

---

## ⚠️ **Key Lessons Learned**

### **Critical Insights**
1. **ANALYZE BEFORE EXTRACTING**: Always read the component first
2. **EXTRACT ONLY USED LOGIC**: Don't create speculative functions
3. **KEEP SIMPLE LOGIC INLINE**: Not everything needs to be extracted
4. **FOCUS ON VALUE**: Extract logic that provides real testing/reusability benefits

### **Common Pitfalls**
- ❌ **Over-extraction**: Creating functions for every piece of logic
- ❌ **Under-analysis**: Not understanding what the component actually does
- ❌ **Speculative functions**: Creating "might be useful" functions
- ❌ **Complex state management**: Over-engineering simple `$state` variables

### **Success Patterns**
- ✅ **Read first, extract second**: Always understand usage before extraction
- ✅ **Focus on complexity**: Extract logic that has business rules, validation, calculations
- ✅ **Test thoroughly**: Comprehensive test coverage catches edge cases
- ✅ **Verify integration**: Always ensure component still works

---

## 🚀 **Future Considerations**

### **Potential Enhancements**
- **Shared logic libraries**: Extract common patterns across components
- **Validation library**: Centralize validation functions if patterns emerge
- **State management helpers**: If complex state patterns emerge
- **Test utilities**: Common test helpers and mocks

### **Long-term Vision**
- **Pure logic layer**: Clean separation between UI and business logic
- **High test coverage**: Reliable, maintainable codebase
- **Developer experience**: Easier debugging, testing, and maintenance
- **Code reusability**: Pure functions can be shared and reused

---

**Last Updated**: August 12, 2025
**Next Session**: Focus on StatblockTemplateDialog analysis and extraction
**Methodology Status**: ✅ Proven and Refined
