import type { Card } from "./card";

export type Layout = "tarot" | "poker";

export type Theme = "classic"
    | "cordial"
    | "scriptorum"
    | "cyberdeck";

export interface Deck {
    id: string;
    meta: {
      title: string;
      description?: string;
      theme: Theme;
      layout: Layout;
      lastEdited: number;
      createdAt: number;
    };
    cards: Card[];
}