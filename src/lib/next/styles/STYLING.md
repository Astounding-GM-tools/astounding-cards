# Styling System

## Core Principles

1. **Minimal Set of Properties**
   - We use a very small set of semantic CSS custom properties
   - Each property has a clear, single purpose
   - Properties are defined using `@property` for type safety
   - Non-inheriting constants (like `--page-padding`) are marked with `inherits: false`

2. **Semantic Names**
   - Properties are semantically named by their purpose
   - `--color` is for text
   - `--accent` for decorative elements
   - `--font-title` and `--font-body` for typography

3. **Override Values, Not Properties**

   ```css
   /* Good: Override the value where needed */
   .inverse-header {
   	--color: white;
   	--accent: #cbd5e0;
   }

   /* Bad: Creating new properties */
   :root {
   	--header-color: #000;
   	--subtitle-color: #666;
   }
   ```

4. **Property Usage**
   - `--color` is ALWAYS used for main text
   - `--accent` for decorative elements, secondary text
   - `--font-title` for headings and display text
   - `--font-body` for body text and UI elements

5. **Theme Implementation**
   - Themes override property VALUES, not create new properties
   - Components use the base properties directly
   - Local overrides should be scoped to specific variants/states

## Property Definitions

```css
@property --page-padding {
	syntax: '<length>';
	initial-value: 10mm;
	inherits: false; /* Constants don't inherit */
}

@property --font-title {
	syntax: '*';
	initial-value: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
	inherits: true;
}

@property --font-body {
	syntax: '*';
	initial-value:
		system-ui,
		-apple-system,
		BlinkMacSystemFont,
		'Segoe UI',
		Roboto,
		'Helvetica Neue',
		Arial,
		sans-serif;
	inherits: true;
}

@property --color {
	syntax: '<color>';
	initial-value: #1a1a1a;
	inherits: true;
}

@property --accent {
	syntax: '<color>';
	initial-value: #4a5568;
	inherits: true;
}
```

## Component Example

```css
.header-title {
	font-family: var(--font-title);
	color: var(--color);
}

.header-subtitle {
	font-family: var(--font-body);
	color: var(--accent);
}
```

## Benefits

1. **Maintainability**: Fewer properties to manage and document
2. **Predictability**: Properties have consistent meaning throughout the system
3. **Flexibility**: Easy to create variants through value overrides
4. **Performance**: Minimal CSS, efficient inheritance
5. **Type Safety**: Properties are strictly typed with `@property`

## Adding New Properties

Before adding a new property, ask:

1. Can this be achieved by overriding an existing property?
2. Is this truly a system-wide concern?
3. Does it have a clear, single purpose?
4. Will it be used consistently across components?
