# Development Rules

## Svelte 5 Runes Mode Standards

**IMPORTANT**: This project uses Svelte 5 runes mode exclusively. Always follow these patterns:

### ❌ NEVER Use (Svelte 4 legacy syntax):

- `export let propName` - Use `$props()` instead
- `let count = 0; $: doubled = count * 2` - Use `$derived()` instead
- `$: if (condition) { ... }` - Use `$effect()` instead
- `$: { /* reactive block */ }` - Use `$effect()` instead

### ✅ ALWAYS Use (Svelte 5 runes):

#### Component Props:

```typescript
// ✅ Correct Svelte 5
const props = $props<{
	required: string;
	optional?: boolean;
}>();
const required = props.required;
const optional = props.optional ?? false;
```

#### State Management:

```typescript
// ✅ Correct Svelte 5
let count = $state(0);
let items = $state<Item[]>([]);
```

#### Derived Values:

```typescript
// ✅ Correct Svelte 5
const doubled = $derived(count * 2);
const filteredItems = $derived(items.filter((item) => item.active));
```

#### Effects:

```typescript
// ✅ Correct Svelte 5
$effect(() => {
	console.log('count changed:', count);
});

$effect(() => {
	// cleanup function
	return () => {
		console.log('cleanup');
	};
});
```

#### Event Dispatching:

```typescript
// ✅ Still correct in Svelte 5
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher<{
	eventName: EventType;
}>();
```

## Key Reminders:

1. **Always** use `$props()` instead of `export let`
2. **Always** use `$state()` for reactive local variables
3. **Always** use `$derived()` instead of reactive statements (`$:`)
4. **Always** use `$effect()` instead of reactive blocks
5. **Always** type your props interface when using TypeScript

## Error to Watch For:

```
Cannot use `export let` in runes mode — use `$props()` instead
```

If you see this error, immediately convert the component to use `$props()` pattern.
