# Typography and Theming Guide

## Core Principles

Our theming system is built on minimal, semantic CSS custom properties. Each property has a clear purpose and is used consistently throughout the system.

### Property Definitions

```css
/* Layout Constants */
@property --page-padding {
    syntax: '<length>';
    initial-value: 10mm;
    inherits: false;  /* Constants don't inherit */
}

/* Typography System */
@property --font-title {
    syntax: '*';
    initial-value: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    inherits: true;
}

@property --font-body {
    syntax: '*';
    initial-value: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    inherits: true;
}

/* Theme Colors */
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

## Usage Guidelines

1. **Use Properties Directly**
   ```css
   /* Good */
   .title {
       color: var(--color);
       font-family: var(--font-title);
   }

   /* Bad - Don't create intermediate variables */
   .title {
       color: var(--title-color);
       font-family: var(--title-font);
   }
   ```

2. **Override Values, Not Properties**
   ```css
   /* Good - Override for specific context */
   .inverse-header {
       --color: white;
       --accent: #cbd5e0;
   }

   /* Bad - Creating new properties */
   :root {
       --header-color: white;
       --subtitle-color: #cbd5e0;
   }
   ```

3. **Consistent Meaning**
   - `--color` is ALWAYS for main text
   - `--accent` for decorative elements and secondary text
   - `--font-title` for headings and display text
   - `--font-body` for body text and UI elements

## Container Queries

Cards use container queries for fluid typography:

```css
.card {
    container-type: inline-size;
    container-name: card;
    font-size: 10cqw; /* Base size relative to card width */
}
```

This ensures consistent text density across different card sizes (poker, tarot).

## Theme Implementation

Themes override property VALUES, not create new properties:

```css
[data-theme="classic"] {
    --color: #1a1a1a;
    --accent: #4a5568;
    --font-title: ui-serif, Georgia, serif;
}

[data-theme="modern"] {
    --color: #2d3748;
    --accent: #805ad5;
    --font-title: system-ui, sans-serif;
}
```

## Benefits

1. **Maintainability**: Minimal set of properties to manage
2. **Predictability**: Properties have consistent meaning
3. **Flexibility**: Easy to create variants through value overrides
4. **Performance**: Efficient inheritance, minimal CSS
5. **Type Safety**: Properties are strictly typed with `@property`