export type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
};

export type ThemeTypography = {
  titleFont: string;
  bodyFont: string;
  nameSize: string;
  roleSize: string;
  bodySize: string;
};

export type ThemeDecoration = {
  borderStyle: string;
  cornerStyle: string;
  frameStyle: string;
  patternUrl?: string;
  iconSet?: string;
};

export type CardTheme = {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  decoration: ThemeDecoration;
  css?: string; // Additional custom CSS
  preview?: {
    title: string;
    role: string;
    traits: string[];
  };
};

// Base themes
export const baseThemes: Record<string, CardTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Clean, minimalist design focused on readability',
    colors: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#666666',
      text: '#000000',
      background: '#ffffff'
    },
    typography: {
      titleFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      nameSize: '1.4rem',
      roleSize: '1rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'solid',
      cornerStyle: 'simple',
      frameStyle: 'classic',
      patternUrl: '/flourishes/classic.svg'
    },
    preview: {
      title: 'Classic',
      role: 'Nothing fancy',
      traits: [
        'Clean: Non-distracting',
        'Readable: System fonts',
        'Genre: 20th century'
      ]
    }
  },

  scriptorum: {
    id: 'scriptorum',
    name: 'Scriptorum',
    description: 'Rich textures and illuminated manuscript style',
    colors: {
      primary: '#8B0000',
      secondary: '#2F4F4F',
      accent: '#DAA520',
      text: '#2C1810',
      background: '#F4E4BC'
    },
    typography: {
      titleFont: 'UnifrakturMaguntia, cursive',
      bodyFont: 'Eagle Lake, cursive',
      nameSize: '1.7rem',
      roleSize: '1.2rem',
      bodySize: '1rem'
    },
    decoration: {
      borderStyle: 'double',
      cornerStyle: 'illuminated',
      frameStyle: 'manuscript',
      patternUrl: '/flourishes/manuscript.svg'
    },
    preview: {
      title: 'Scriptorum',
      role: 'Medieval manuscript æsthetic',
      traits: [
          'Feel: Gothic',
          'Genre: Fantasy'
      ]
    }
  },

  cordial: {
    id: 'cordial',
    name: 'Cordial',
    description: 'Elegant aesthetics with flowing organic elements',
    colors: {
      primary: '#7D98A1',      // Silvery blue-grey
      secondary: '#2F4F4F',    // Deep forest grey
      accent: '#C0D8D8',       // Pale silver-blue
      text: '#2C3E50',         // Deep blue-grey
      background: '#F5F9F9'    // Very pale silver
    },
    typography: {
      titleFont: 'Ballet, cursive',
      bodyFont: 'Tangerine, cursive',
      nameSize: '1.6rem',
      roleSize: '1.2rem',
      bodySize: '1rem'
    },
    decoration: {
      borderStyle: 'organic',
      cornerStyle: 'flowing',
      frameStyle: 'cordial',
      patternUrl: '/flourishes/cordial.svg'
    },
    preview: {
      title: 'Cordial',
      role: 'Art Nouveau',
      traits: [
        'Elegant: Gracefully swirly',
        'Dress code: Black tie and tails',
      ]
    }
  },

  cyberdeck: {
    id: 'cyberdeck',
    name: 'Cyberdeck',
    description: 'High-tech aesthetic with digital elements',
    colors: {
      primary: '#00b341',     // Darker matrix green
      secondary: '#1a1a1a',   // Dark gray
      accent: '#0098b8',      // Darker neon blue
      text: '#1a1a1a',        // Dark gray text
      background: 'white'     // White background
    },
    typography: {
      titleFont: 'Orbitron, sans-serif',
      bodyFont: 'Share Tech Mono, monospace',
      nameSize: '1.6rem',
      roleSize: '1.2rem',
      bodySize: '1rem'
    },
    decoration: {
      borderStyle: 'solid',
      cornerStyle: 'tech',
      frameStyle: 'digital',
      patternUrl: '/flourishes/tech.svg'
    },
    preview: {
      title: 'Cyberdeck',
      role: 'Dark future',
      traits: [
        'Hi-Tech: Clean and modern',
        'Vibe: Dark and moody',
        'Genre: Cyberpunk, Sci-Fi'
      ]
    }
  }

  // Keegan theme temporarily disabled while in development
  /*
  keegan: {
    id: 'keegan',
    name: 'Keegan',
    description: 'A vintage 70s trading card theme inspired by classic football cards',
    colors: {
      primary: '#D42E12',
      secondary: '#1B4B8A',
      accent: '#F4D03F',
      text: '#1A1A1A',
      background: '#F4F1E9'
    },
    typography: {
      titleFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      nameSize: '1.4rem',
      roleSize: '1rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'solid',
      cornerStyle: 'simple',
      frameStyle: 'classic',
      patternUrl: '/flourishes/classic.svg'
    }
  }
  */
};

// Function to create a custom theme based on a base theme
export function createCustomTheme(
  baseThemeId: string,
  customizations: Partial<CardTheme>
): CardTheme {
  const baseTheme = baseThemes[baseThemeId];
  if (!baseTheme) throw new Error(`Theme ${baseThemeId} not found`);

  return {
    ...baseTheme,
    ...customizations,
    colors: { ...baseTheme.colors, ...customizations.colors },
    typography: { ...baseTheme.typography, ...customizations.typography },
    decoration: { ...baseTheme.decoration, ...customizations.decoration }
  };
}

// Function to validate a custom theme
export function validateTheme(theme: unknown): theme is CardTheme {
  if (!theme || typeof theme !== 'object') return false;
  const t = theme as CardTheme;

  return !!(
    t.id &&
    t.name &&
    t.colors?.primary &&
    t.colors?.text &&
    t.typography?.titleFont &&
    t.typography?.bodyFont &&
    t.decoration?.borderStyle
  );
} 