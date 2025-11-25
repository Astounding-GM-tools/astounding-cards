# Development Methodology - Fast, Safe Iteration Cycles

## 🚀 Core Philosophy: "Cooking with Gas"

This document outlines our proven approach for rapid, reliable feature development that has achieved **warp speed iteration** while maintaining robustness.

## 📋 The Iterative Process

### 1. **Logic-First Architecture**

- Extract business logic from Svelte components into `.svelte.ts` files
- Keep components focused on presentation and user interaction
- Logic files are pure TypeScript - easier to test, debug, and reason about

### 2. **Test-Driven Development Cycle**

```
Logic Design → Unit Tests (Vitest) → Implementation → E2E Tests (Playwright) → Integration
     ↑                                                                              ↓
     ←─────────────────────── Refactor & Iterate ←─────────────────────────────────
```

### 3. **Testing Strategy**

#### **Unit Tests (Vitest) - Logic Layer**

- **Target:** 100% code coverage for all `.svelte.ts` logic files
- **Speed:** Milliseconds per test
- **Purpose:** Catch logic errors instantly, enable fearless refactoring
- **Run:** On every save, in CI/CD pipeline

#### **E2E Tests (Playwright) - User Experience Layer**

- **Target:** Core user workflows and integration points
- **Speed:** 1-2 seconds for successful tests, parallel execution
- **Purpose:** Ensure features work end-to-end from user perspective
- **Run:** Before commits, in CI/CD pipeline

## 🏗️ Architecture Patterns

### **File Structure**

```
src/lib/
├── components/
│   ├── MyComponent.svelte          # Pure presentation
│   └── MyComponent.svelte.ts       # Extracted logic
├── stores/
│   ├── myStore.ts                  # State management
│   └── myStore.test.ts             # Unit tests
└── utils/
    ├── myUtility.ts                # Pure functions
    └── myUtility.test.ts           # Unit tests
```

### **Logic Extraction Examples**

#### ❌ Before: Logic in Component

```svelte
<!-- MyComponent.svelte -->
<script lang="ts">
	let items = [];

	function addItem(name: string) {
		if (!name.trim()) return;
		items = [
			...items,
			{
				id: crypto.randomUUID(),
				name: name.trim(),
				createdAt: Date.now()
			}
		];
	}

	function deleteItem(id: string) {
		items = items.filter((item) => item.id !== id);
	}
</script>
```

#### ✅ After: Logic Extracted

```typescript
// MyComponent.svelte.ts
export interface Item {
	id: string;
	name: string;
	createdAt: number;
}

export function createItem(name: string): Item | null {
	if (!name.trim()) return null;
	return {
		id: crypto.randomUUID(),
		name: name.trim(),
		createdAt: Date.now()
	};
}

export function addItemToList(items: Item[], name: string): Item[] {
	const newItem = createItem(name);
	return newItem ? [...items, newItem] : items;
}

export function removeItemFromList(items: Item[], id: string): Item[] {
	return items.filter((item) => item.id !== id);
}
```

```svelte
<!-- MyComponent.svelte -->
<script lang="ts">
	import { addItemToList, removeItemFromList } from './MyComponent.svelte.ts';

	let items = [];

	function addItem(name: string) {
		items = addItemToList(items, name);
	}

	function deleteItem(id: string) {
		items = removeItemFromList(items, id);
	}
</script>
```

## 🧪 Testing Best Practices

### **Unit Test Template**

```typescript
// MyComponent.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { createItem, addItemToList, removeItemFromList } from './MyComponent.svelte.ts';

describe('MyComponent Logic', () => {
	describe('createItem', () => {
		it('creates item with valid name', () => {
			const item = createItem('Test Item');
			expect(item).toEqual({
				id: expect.any(String),
				name: 'Test Item',
				createdAt: expect.any(Number)
			});
		});

		it('returns null for empty name', () => {
			expect(createItem('')).toBeNull();
			expect(createItem('   ')).toBeNull();
		});

		it('trims whitespace from name', () => {
			const item = createItem('  Test Item  ');
			expect(item?.name).toBe('Test Item');
		});
	});

	describe('addItemToList', () => {
		it('adds valid item to list', () => {
			const items = [];
			const result = addItemToList(items, 'New Item');
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('New Item');
		});

		it('does not modify original array', () => {
			const items = [{ id: '1', name: 'Existing', createdAt: Date.now() }];
			const result = addItemToList(items, 'New Item');
			expect(items).toHaveLength(1);
			expect(result).toHaveLength(2);
		});

		it('ignores invalid names', () => {
			const items = [];
			const result = addItemToList(items, '');
			expect(result).toEqual(items);
		});
	});
});
```

### **E2E Test Template**

```typescript
// myFeature.test.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature - Fast Execution', () => {
	test('complete workflow with realistic data', async ({ page }) => {
		// Use pre-defined data for speed
		const testData = {
			/* realistic test data */
		};

		await page.goto(`/?data=${encodeURIComponent(JSON.stringify(testData))}`);
		await page.waitForLoadState('networkidle');

		// Test core workflow
		await expect(page.locator('text=Expected Content')).toBeVisible();

		// Make changes
		await page.locator('input[value="Initial"]').fill('Modified');

		// Verify changes
		await expect(page.locator('text=Modified')).toBeVisible();
	});
});
```

## 🔄 Development Workflow

### **Daily Cycle**

1. **Start:** Run unit tests (`npm run test:unit:watch`)
2. **Code:** Write logic in `.svelte.ts` files with tests
3. **Integrate:** Update Svelte components to use new logic
4. **Verify:** Run E2E tests (`npm run test:e2e`)
5. **Commit:** All tests passing? Ship it! 🚢

### **Feature Development**

1. **Design Logic:** Define interfaces and functions in `.svelte.ts`
2. **Write Tests:** Cover all logic paths with Vitest
3. **Implement:** Make tests pass
4. **Component Integration:** Update Svelte components
5. **E2E Verification:** Test user workflows
6. **Refactor:** Clean up with confidence (tests protect you)

## 📊 Success Metrics

### **Speed Indicators**

- Unit tests: < 50ms total runtime
- E2E tests: < 5s for successful scenarios
- Development cycle: Feature → Tests → Implementation < 30 minutes

### **Quality Indicators**

- Unit test coverage: 100% for logic files
- E2E test coverage: All critical user paths
- Refactoring confidence: Can change logic without fear

## 🎯 Benefits Realized

1. **🚀 Warp Speed Development**: Logic changes tested in milliseconds
2. **🛡️ Fearless Refactoring**: Comprehensive test coverage
3. **🎪 Parallel Development**: Logic and UI can be developed independently
4. **🔍 Easier Debugging**: Pure functions are easier to reason about
5. **📈 Higher Quality**: Bugs caught early in fast unit tests
6. **🤝 Better Collaboration**: Clear separation of concerns

## 🚨 Red Flags to Avoid

- ❌ Complex logic mixed into Svelte components
- ❌ Tests that take longer than 5 seconds
- ❌ Skipping unit tests "just this once"
- ❌ E2E tests that test logic instead of workflows
- ❌ Not running tests before commits

## 🎉 Success Story

> "We went from 30+ second timeout failures to 1-2 second successful tests, achieving 50% E2E pass rate immediately after implementing this methodology. Unit tests run in milliseconds and give us confidence to refactor fearlessly."

---

**Remember**: This methodology works because it separates concerns, provides fast feedback loops, and builds confidence through comprehensive testing. Stick to it, and you'll maintain warp speed development! 🚀
