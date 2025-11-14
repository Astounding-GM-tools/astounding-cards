# Theming System Documentation

## Overview

The theming system uses a hybrid approach combining CSS custom properties with SVG sprites and JavaScript theme switching. The system is built around a default theme (Classic) with other themes inheriting and overriding specific properties as needed.

## Active Themes

1. **Classic Theme**:
   - Default theme using base properties
   - Clean, minimal design
   - Optimized for print
   - Configurable flourish visibility

2. **Scriptorum Theme**:
   - Rich manuscript style
   - Illuminated manuscript aesthetic
   - Elegant typography with Cinzel and Crimson Text
   - Rich textures and decorative elements

3. **Cordial Theme**:
   - Elegant flowing design
   - Silvery blue-grey color scheme
   - Subtle flourishes and decorations
   - Clean, modern typography

4. **Cyberdeck Theme**:
   - High-tech aesthetic
   - Matrix-inspired color scheme
   - Sharp, geometric fonts
   - Digital-style decorative elements

## File Structure

```
src/lib/themes/
├── styles/
│   ├── properties.css    # Base property declarations
│   ├── index.css        # Imports and organization
│   ├── classic.css      # Default theme
│   ├── scriptorum.css   # Manuscript theme
│   ├── cordial.css      # Elegant theme
│   ├── cyberdeck.css    # Tech theme
│   └── ...             # Future themes
└── THEMING.md          # This documentation
```

## Core Concepts

1. **Property Declarations**:
   - All theme variables MUST be declared in `properties.css` using `@property`
   - Never declare new variables in theme files
   - Always use existing variables or hardcode values
   - Ask before adding new variables to properties.css

2. **Theme Scoping**:
   - Themes are scoped using the `[data-theme="theme-name"]` selector
   - Theme variables are applied at the theme-scope div level
   - Variables inherit properly through the component tree
   - No use of `:root` for theme variables

3. **Inheritance System**:
   - Variables inherit from their parent variables
   - Example: `--flourish-content-opacity` inherits from `--flourish-opacity`
   - Override only at the most specific level needed
   - Don't create intermediary variables

4. **Print-First Design**:
   - All themes must work well in print
   - Use appropriate opacity values
   - Consider contrast and readability
   - Test in black & white

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
- `--role-font-family`: Font for role text (inherits from body)

### Text Alignment

- `--title-text-align`: Title alignment
- `--role-text-align`: Role text alignment
- `--desc-text-align`: Description text alignment

### Flourish System

Base Variables:

- `--flourish-color`: Color of all flourishes
- `--flourish-opacity`: Base opacity for all flourishes
- `--flourish-size`: Base size for all flourishes
- `--flourish-aspect`: Base aspect ratio

Portrait Flourishes:

- `--portrait-flourish-size`: Size for portrait flourishes
- `--portrait-flourish-opacity`: Base opacity for portrait flourishes
- `--portrait-flourish-aspect`: Aspect ratio for portrait flourishes
- `--flourish-portrait-top-left-opacity`: Individual corner control
- `--flourish-portrait-top-right-opacity`: Individual corner control
- `--flourish-portrait-bottom-left-opacity`: Individual corner control
- `--flourish-portrait-bottom-right-opacity`: Individual corner control

Content Flourishes:

- `--content-flourish-size`: Size for content flourishes
- `--content-flourish-opacity`: Base opacity for content flourishes
- `--content-flourish-aspect`: Aspect ratio for content flourishes
- `--flourish-content-top-left-opacity`: Individual corner control
- `--flourish-content-top-right-opacity`: Individual corner control
- `--flourish-content-bottom-left-opacity`: Individual corner control
- `--flourish-content-bottom-right-opacity`: Individual corner control

### Content Box Style

- `--content-box-bg`: Background color for content area
- `--content-box-radius`: Border radius
- `--content-box-border-width`: Border width
- `--content-box-shadow`: Box shadow

## Creating a New Theme

1. Create a new file `your-theme.css` in `styles/`
2. Import it in `index.css`
3. Only override what differs from Classic:

```css
/* Your Theme - Brief description */
[data-theme='your-theme'] {
	/* Theme Colors */
	--theme-primary: #your-color;
	--theme-secondary: #another-color;
	--theme-accent: #accent-color;
	--theme-text: #text-color;
	--theme-background: #bg-color;

	/* Typography */
	--theme-title-font: 'Your Font', sans-serif;
	--theme-body-font: 'Body Font', sans-serif;
	--theme-title-weight: 700;
	--theme-body-weight: 400;

	/* Text Alignment */
	--title-text-align: center;
	--role-text-align: center;
	--desc-text-align: left;

	/* Decorative Elements */
	--show-corner-flourish: 1;
	--show-dividers: 1;
	--show-frame: 1;
	--show-texture: 0;

	/* Flourish System */
	--flourish-color: var(--theme-primary);
	--flourish-opacity: 0.8;
	--flourish-size: 2.5rem;
	--flourish-aspect: 1;

	/* Content Box Style */
	--content-box-radius: 2mm;
	--content-box-border-width: 1px;
	--content-box-shadow: none;
	--content-box-bg: white;
}
```

## Best Practices

1. **Variable Usage**:
   - Use the defined variables from properties.css
   - Override at the most specific level needed
   - Keep values consistent with theme style
   - Test all variations (front/back cards)

2. **Print Optimization**:
   - Test with different printers
   - Check contrast and readability
   - Verify flourish visibility
   - Consider ink usage

3. **Flourish Control**:
   - Use individual opacity controls
   - Test all flourish positions
   - Verify print appearance
   - Consider overall balance

4. **Typography**:
   - Choose appropriate fonts
   - Test print readability
   - Verify font loading
   - Check alignment and spacing

## Component Integration

The theme system integrates with components through a theme-scope div:

```svelte
<div class="card">
	<div class="theme-scope" data-theme={activeTheme}>
		<!-- Card content here -->
	</div>
</div>
```

This ensures:

- Theme variables are properly scoped
- Variables inherit correctly
- Multiple themes can coexist
- Clean separation of concerns

## Debugging

1. **Theme Issues**:
   - Check theme variable scope
   - Verify data-theme attribute
   - Test variable inheritance
   - Use browser dev tools

2. **Print Testing**:
   - Test with different printers
   - Check black & white output
   - Verify flourish visibility
   - Test all card types

3. **Common Problems**:
   - Theme not applying (check scope)
   - Flourishes not visible (check opacity)
   - Font not loading (check imports)
   - Print issues (check contrast)
