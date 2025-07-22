# Theming System Documentation

## Overview

The theming system uses a hybrid approach combining CSS custom properties with SVG sprites and JavaScript theme switching. The system is built around a default theme (Classic) with other themes inheriting and overriding specific properties as needed.

## File Structure

```
src/lib/themes/
├── styles/
│   ├── properties.css    # Base property declarations
│   ├── index.css        # Imports and organization
│   ├── classic.css      # Default theme (no overrides)
│   ├── manuscript.css   # Manuscript theme overrides
│   └── ...             # Other theme files
└── THEMING.md          # This documentation
```

## Core Concepts

1. **Property Declarations**: All theme variables are declared in `properties.css` using `@property`. This provides:
   - Type safety
   - Default values (Classic theme)
   - Proper inheritance
   - Transition support

2. **Classic Theme as Default**: 
   - The Classic theme uses the default values from `properties.css`
   - No overrides needed in `classic.css`
   - Serves as the baseline for other themes

3. **Minimal Overrides**:
   - Other themes should only override properties that differ from Classic
   - Don't repeat properties that remain at default values
   - Keep theme files focused and maintainable

## Theme Variables

### Core Colors
- `--theme-primary`: Main theme color
- `--theme-secondary`: Secondary theme color
- `--theme-accent`: Accent color for highlights
- `--theme-background`: Background color
- `--theme-text`: Main text color

### Typography
- `--theme-title-font`: Font family for titles
- `--theme-body-font`: Font family for body text
- `--theme-title-weight`: Font weight for titles
- `--theme-body-weight`: Font weight for body text

### Decorative Elements
- `--show-corner-flourish`: Toggle corner decorations (0/1)
- `--show-dividers`: Toggle dividers (0/1)
- `--show-frame`: Toggle frame (0/1)
- `--show-texture`: Toggle texture effects (0/1)

### Frame Style
- `--frame-style`: Border style (solid, double, etc.)
- `--frame-width`: Border width
- `--frame-opacity`: Border opacity

### Flourish System
- `--flourish-color`: Color of decorative flourishes
- `--flourish-opacity`: Opacity of flourishes
- `--flourish-size`: Base size of flourishes
- `--flourish-aspect`: Aspect ratio of flourishes

### Content Box Style
- `--content-box-radius`: Border radius
- `--content-box-shadow`: Box shadow

## Creating a New Theme

1. Create a new file `your-theme.css` in `styles/`
2. Import it in `index.css`
3. Only override what differs from Classic:

```css
/* Your Theme - Brief description */
:root[data-theme="your-theme"] {
  /* Only override what's different from Classic */
  --theme-primary: #your-color;
  --theme-background: #your-bg;
  --theme-title-font: 'Your Font', sans-serif;
}
```

## Best Practices

1. **Property Declaration**:
   - Always declare properties in `properties.css`
   - Use appropriate syntax types (`<color>`, `<length>`, etc.)
   - Set meaningful default values

2. **Theme Development**:
   - Start by identifying what's different from Classic
   - Group related properties together
   - Comment color values with descriptive names
   - Test print styles

3. **Maintainability**:
   - Keep theme files small and focused
   - Document significant deviations
   - Consider print optimization
   - Test with different card types

4. **SVG Integration**:
   - SVG flourishes are defined in app.html
   - Use `currentColor` in SVGs for theme color support
   - Test flourish visibility in print

## SVG + CSS Hybrid System

The theming system uses a hybrid approach for flourishes and decorative elements:

1. **SVG Sprite Sheet**:
   - Defined in `app.html` head section
   - Contains all flourish designs as `<symbol>` elements
   - Each theme can have its own set of flourishes
   - Uses `currentColor` for theme-controlled coloring
   ```html
   <svg style="display: none;">
     <symbol id="flourish-classic" viewBox="0 0 100 100">
       <!-- SVG content using currentColor -->
     </symbol>
     <symbol id="flourish-manuscript" viewBox="0 0 100 100">
       <!-- Different SVG content -->
     </symbol>
   </svg>
   ```

2. **Dynamic References**:
   - SVG elements in components use `<use>` to reference sprites
   - Theme name is dynamically inserted via Svelte
   ```html
   <svg class="flourish">
     <use href="#flourish-{$currentDeck?.meta.theme || 'classic'}" />
   </svg>
   ```

3. **CSS Styling**:
   - Theme CSS controls colors via `--flourish-color`
   - Size and positioning via CSS variables
   - Opacity and other visual properties
   - Print optimizations
   ```css
   .flourish {
     width: var(--flourish-size);
     aspect-ratio: var(--flourish-aspect);
     color: var(--flourish-color);
   }
   ```

4. **JavaScript Integration**:
   - Theme switching handled by Svelte stores
   - Reactive updates to `data-theme` attribute
   - Automatic fallback to Classic theme

### Benefits of the Hybrid System

1. **Performance**:
   - SVG sprites loaded once, cached
   - No additional HTTP requests
   - Efficient DOM updates

2. **Flexibility**:
   - Easy to add new flourish designs
   - Theme-specific variations
   - Dynamic sizing and positioning

3. **Maintainability**:
   - Central SVG definitions
   - CSS controls presentation
   - Clear separation of concerns

### Best Practices for SVG Flourishes

1. **SVG Design**:
   - Use `currentColor` for theme-controlled elements
   - Keep viewBox consistent (e.g., 100x100)
   - Optimize SVG code
   - Test with different sizes

2. **Component Usage**:
   - Group flourishes logically
   - Use semantic class names
   - Consider print layout
   - Test with dev mode

3. **Theme Integration**:
   - Define flourish colors explicitly
   - Consider opacity for layering
   - Test with light and dark themes
   - Verify print appearance

## Font System

The theming system uses Google Fonts for consistent, web-safe typography across themes. Each theme can specify its own font combinations for different text elements.

### Font Loading

1. **Google Fonts Integration**:
   - Fonts are loaded in `app.html`
   - Use `display=swap` for better performance
   - Include both regular and bold weights
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Text:wght@400;700&display=swap" rel="stylesheet">
   ```

2. **Font Fallbacks**:
   - Always include system font fallbacks
   - Match fallback style to primary font
   ```css
   --theme-title-font: 'Cinzel', Georgia, serif;
   --theme-body-font: 'Crimson Text', 'Times New Roman', serif;
   ```

### Theme-Specific Fonts

Each theme can define its own typography:

1. **Classic Theme** (Default):
   - System fonts for clean, modern look
   - Excellent print compatibility
   ```css
   --theme-title-font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
   --theme-body-font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
   ```

2. **Manuscript Theme**:
   - Serif fonts for traditional feel
   - Decorative title font
   ```css
   --theme-title-font: 'Cinzel', Georgia, serif;
   --theme-body-font: 'Crimson Text', 'Times New Roman', serif;
   ```

### Font Size System

1. **Responsive Sizing**:
   - Use container query units (`cqw`)
   - Set min/max constraints with `clamp()`
   ```css
   --base-font-size: 0.9cqw;
   --title-font-size: clamp(1.2rem, 1.4em, 2rem);
   ```

2. **Size Hierarchy**:
   - Title: Largest, most prominent
   - Role: Secondary emphasis
   - Body text: Optimized for readability
   - Traits/Stats: Compact but legible

### Best Practices

1. **Font Selection**:
   - Choose fonts that match theme style
   - Test readability at all sizes
   - Consider print appearance
   - Verify language support

2. **Performance**:
   - Load only needed weights
   - Use `font-display: swap`
   - Consider subsetting for specific languages
   - Monitor loading performance

3. **Accessibility**:
   - Maintain sufficient contrast
   - Keep minimum size readable
   - Test with screen readers
   - Consider dyslexic-friendly options

4. **Print Considerations**:
   - Test font rendering in print
   - Adjust sizes for physical cards
   - Consider ink usage
   - Test on different printers

### Common Font Combinations

Recommended font pairings for different theme styles:

1. **Modern/Clean**:
   ```css
   --theme-title-font: 'Roboto', system-ui, sans-serif;
   --theme-body-font: 'Open Sans', system-ui, sans-serif;
   ```

2. **Traditional/Elegant**:
   ```css
   --theme-title-font: 'Cinzel', Georgia, serif;
   --theme-body-font: 'Crimson Text', 'Times New Roman', serif;
   ```

3. **Technical/Sharp**:
   ```css
   --theme-title-font: 'Orbitron', 'Arial Black', sans-serif;
   --theme-body-font: 'Share Tech Mono', 'Courier New', monospace;
   ```

4. **Natural/Organic**:
   ```css
   --theme-title-font: 'Philosopher', Georgia, serif;
   --theme-body-font: 'Lato', system-ui, sans-serif;
   ```

### Debugging Font Issues

1. **Common Problems**:
   - Font not loading
   - Incorrect weight displaying
   - Flash of unstyled text (FOUT)
   - Print rendering issues

2. **Solutions**:
   - Check font URL in dev tools
   - Verify font-family spelling
   - Test fallback chain
   - Use browser font tools

## Print Considerations

Themes should consider print optimization:
- Avoid background colors - they consume excessive ink/toner
- Use white background for all themes to maximize ink efficiency
- Reduce opacity for better print contrast
- Adjust line weights for printer capabilities
- Test on both color and B&W printers

### Ink-Efficient Design

1. **Colors**:
   - Keep card backgrounds white
   - Use background colors sparingly and only in content boxes
   - Use dark text for contrast
   - Apply color sparingly in decorative elements
   - Consider grayscale printing
   ```css
   /* Example: Selective background color */
   :root[data-theme="manuscript"] {
     --content-box-bg: #F4E4BC;    /* Background only for content area */
     --theme-text: #2C1810;        /* Dark text for contrast */
   }
   ```

2. **Line Weights**:
   - Thinner lines use less ink
   - Adjust for different printers
   - Test minimum visible thickness

3. **Opacity**:
   - Lower opacity means less ink
   - Balance visibility with efficiency
   - Test different opacity levels

## Debugging

1. **Dev Mode**:
   - Toggle dev mode to see flourish boundaries
   - Debug borders show in bright orange
   - Use for alignment and sizing checks

2. **Common Issues**:
   - Check property syntax if transitions don't work
   - Verify theme name matches in CSS and HTML
   - Test with different card types and sizes

## Examples

### Minimal Theme Override
```css
:root[data-theme="minimal"] {
  --theme-primary: #333;
  --show-flourishes: 0;
  --show-frame: 0;
}
```

### Rich Theme Override
```css
:root[data-theme="rich"] {
  /* Colors */
  --theme-primary: #8B0000;    /* Deep red */
  --theme-accent: #DAA520;     /* Golden */
  
  /* Typography */
  --theme-title-font: 'Cinzel', serif;
  
  /* Flourishes */
  --flourish-size: 3rem;
  --flourish-opacity: 0.8;
}
``` 