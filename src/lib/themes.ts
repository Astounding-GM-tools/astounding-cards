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
    }
  },

  manuscript: {
    id: 'manuscript',
    name: 'Manuscript',
    description: 'Rich textures and illuminated manuscript style',
    colors: {
      primary: '#8B0000',
      secondary: '#2F4F4F',
      accent: '#DAA520',
      text: '#2C1810',
      background: '#F4E4BC'
    },
    typography: {
      titleFont: 'Cinzel, serif',
      bodyFont: 'Crimson Text, serif',
      nameSize: '1.7rem',
      roleSize: '1.2rem',
      bodySize: '1rem'
    },
    decoration: {
      borderStyle: 'double',
      cornerStyle: 'illuminated',
      frameStyle: 'manuscript',
      patternUrl: '/flourishes/manuscript.svg'
    }
  },

  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean geometric shapes and strong typography',
    colors: {
      primary: '#1A237E',
      secondary: '#424242',
      accent: '#B71C1C',
      text: '#212121',
      background: '#FFFFFF'
    },
    typography: {
      titleFont: 'Montserrat, sans-serif',
      bodyFont: 'Open Sans, sans-serif',
      nameSize: '1.4rem',
      roleSize: '1rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'solid',
      cornerStyle: 'geometric',
      frameStyle: 'modern',
      patternUrl: '/flourishes/modern.svg'
    }
  },

  nature: {
    id: 'nature',
    name: 'Nature',
    description: 'Organic shapes and natural motifs',
    colors: {
      primary: '#4B6B55',
      secondary: '#A3B5C0',
      accent: '#E5C39C',
      text: '#2C3E50',
      background: '#F5F9F2'
    },
    typography: {
      titleFont: 'Cinzel, serif',
      bodyFont: 'Lato, sans-serif',
      nameSize: '1.6rem',
      roleSize: '1.1rem',
      bodySize: '0.95rem'
    },
    decoration: {
      borderStyle: 'organic',
      cornerStyle: 'leafy',
      frameStyle: 'nature',
      patternUrl: '/flourishes/nature.svg'
    }
  },

  tech: {
    id: 'tech',
    name: 'Tech',
    description: 'High-tech aesthetic with digital elements',
    colors: {
      primary: '#FF0055',
      secondary: '#00FFF5',
      accent: '#FFE600',
      text: '#FFFFFF',
      background: '#0D0221'
    },
    typography: {
      titleFont: 'Orbitron, sans-serif',
      bodyFont: 'Share Tech Mono, monospace',
      nameSize: '1.5rem',
      roleSize: '1rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'circuit',
      cornerStyle: 'tech',
      frameStyle: 'digital',
      patternUrl: '/flourishes/tech.svg'
    }
  },

  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro aesthetics with aged effects',
    colors: {
      primary: '#F57C00',
      secondary: '#795548',
      accent: '#FDD835',
      text: '#212121',
      background: '#FFFDE7'
    },
    typography: {
      titleFont: 'Graduate, serif',
      bodyFont: 'Roboto Condensed, sans-serif',
      nameSize: '1.6rem',
      roleSize: '1.2rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'retro',
      cornerStyle: 'worn',
      frameStyle: 'vintage',
      patternUrl: '/flourishes/vintage.svg'
    }
  }
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