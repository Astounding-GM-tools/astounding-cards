import type { CardTheme } from '$lib/themes';
import type { Card } from '$lib/types';

/**
 * Creates a preview card object for theme display purposes
 * @param theme The theme to create a preview card for
 * @returns A card object formatted for preview display
 */
export function createPreviewCard(theme: CardTheme): Card {
  return {
    id: 'preview',  // Required by Card type
    name: theme.preview?.title || theme.name,
    role: theme.preview?.role || theme.description,
    traits: theme.preview?.traits || [],
    image: theme.preview?.portrait ? `/portraits/${theme.preview.portrait}` : null,
    stat: {
      type: 'character' as const,
      value: 'Preview'
    },
    desc: '',  // Required by type but not used in preview
    secrets: [],  // Required by type but not used in preview
    type: 'Preview'  // Required by Card type
  };
}
