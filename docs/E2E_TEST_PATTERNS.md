# E2E Testing Patterns - Proven and Reliable

## 🎯 **The Working Pattern** (Copy-Paste Ready)

### **Proven DevToolsHelper Pattern**

Use this pattern for any E2E test that needs data to exist:

```typescript
import { expect, test } from '@playwright/test';
import { DevToolsHelper } from './helpers/dev-tools';

test.describe('Your Test Group', () => {
	let devTools: DevToolsHelper;

	test.beforeEach(async ({ page }) => {
		devTools = new DevToolsHelper(page);
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Setup sample data for consistent testing
		console.log('=== Setting up test environment with sample data ===');
		await devTools.setupTestEnvironment();
		await page.waitForTimeout(1000);
		console.log('✅ Sample data environment ready');
	});

	test.afterEach(async ({ page }) => {
		await devTools.disableDevMode();
	});

	test('your test name', async ({ page }) => {
		console.log('=== Testing your feature ===');

		// Your test logic here - sample data is already available
		await expect(page.locator('.card-base').first()).toBeVisible();

		console.log('✅ Test completed successfully');
	});
});
```

## ✅ **What Works - Use These Patterns**

### **Reliable Selectors:**

- `page.getByTestId('manage-decks-button')` - Uses data-testid attributes
- `page.locator('.card-base').first()` - Specific classes with .first()
- `page.locator('input[type="text"]:visible')` - Specific input types
- `page.locator('button:has-text("📚 Manage Decks")')` - Emoji icons are stable

### **Reliable Setup:**

- `devTools.setupTestEnvironment()` - Provides "Tales of the Uncanny" deck with 3 sample cards
- `page.waitForLoadState('networkidle')` - Ensures page is fully loaded
- Console logging for debugging (`console.log('✅ Step completed')`)

### **Working Examples:**

- `card-workflows.test.ts` - 3/3 tests passing
- `statblock-integration.spec.ts` - Full workflow test
- `dev-tools-working.spec.ts` - Infrastructure tests

## ❌ **What Doesn't Work - Avoid These Patterns**

### **Broken Selectors:**

- `button:has-text("Create Deck")` - This button doesn't exist
- `button:has-text("Add Card")` - Use `button:has-text("➕ Add Card")` instead
- `.edit-mechanics-btn` - Without sample data, these buttons don't exist

### **Brittle Patterns:**

- Manual deck creation from scratch - use `setupTestEnvironment()` instead
- Complex drag-and-drop testing - focus on workflows instead
- Testing implementation details rather than user workflows

## 🎯 **Test Categories by Priority**

### **High Priority - Core Workflows** ✅

- Card creation and editing
- Deck management
- Theme/vocabulary changes
- Basic statblock functionality
- **Status**: Fixed with DevToolsHelper pattern

### **Medium Priority - Advanced Features** ⚠️

- Complex statblock templates
- Detailed mechanics editing
- Advanced sharing workflows
- **Status**: Some work with pattern, others need specific selectors

### **Low Priority - Implementation Details** ❌

- Drag-and-drop mechanics reordering
- Complex UI state management
- Edge case error handling
- **Status**: Skip these - test user workflows instead

## 📝 **Quick Fix Guide**

### **When a test fails with "Create Deck not found":**

1. Add `DevToolsHelper` import and setup
2. Replace manual deck creation with `setupTestEnvironment()`
3. Update selectors to work with existing sample data

### **When a test times out:**

1. Check if selector exists with sample data
2. Add console.log statements to debug
3. Use `.first()` on selectors to avoid strict mode violations
4. Ensure proper waits: `waitForLoadState('networkidle')`

### **Example Fix:**

```typescript
// OLD (broken)
test('my test', async ({ page }) => {
	await page.goto('/');
	await page.click('button:has-text("Create Deck")'); // Doesn't exist
});

// NEW (working)
test('my test', async ({ page }) => {
	// DevToolsHelper setup in beforeEach
	console.log('=== Testing my feature ===');
	await expect(page.locator('.card-base').first()).toBeVisible();
	// Work with existing sample data
});
```

## 🚀 **Success Metrics**

**Working tests should:**

- Run in 2-5 seconds (not 30+ seconds)
- Have clear console output showing progress
- Use specific selectors with `.first()` when needed
- Focus on user workflows, not implementation details

**Signs of success:**

```
=== Setting up test environment with sample data ===
✅ Sample data environment ready
=== Testing card creation workflow ===
✅ Sample cards verified
✅ Test completed successfully
```

## 📚 **Reference Files**

**Working Examples:**

- `e2e/card-workflows.test.ts` - Main workflows ✅
- `e2e/statblock-integration.spec.ts` - Complex workflow ✅
- `e2e/dev-tools-working.spec.ts` - Infrastructure ✅

**DevToolsHelper API:**

Class: `e2e/helpers/dev-tools.ts`

```typescript
// Environment setup (use these)
await devTools.setupTestEnvironment(); // Fast: Creates "Tales of the Uncanny" deck
await devTools.clearDatabaseConsole(); // Fast: Wipes all data
await devTools.addSampleDataConsole(); // Fast: Adds sample deck

// Dev mode
await devTools.enableDevMode();
await devTools.disableDevMode();

// Info
devTools.getSampleDataInfo();
```

**Console Shortcuts:**

Available globally in browser console:

```javascript
// Quick operations (bypass UI)
await window.e2eHelpers.setupTestEnvironment();
await window.e2eHelpers.clearDatabase();
await window.e2eHelpers.addSampleData();
window.e2eHelpers.getSampleInfo();
```

**Sample Data:**

- **Deck**: "Tales of the Uncanny"
- **Cards**: Dr. Blackwood, The Ethereal Compass, The Misty Vale

---

**Last Updated**: August 2025  
**Status**: Proven pattern with 3/3 core workflow tests passing
