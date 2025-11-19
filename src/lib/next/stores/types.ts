import type { Card, Layout, Deck } from "../types/deck";

export interface LoadingState {
    isLoading: boolean;
    message: string;
    operation: string;
}

export interface NextDeckStore {
    get deck(): Deck | null;
    get isLoading(): boolean;
    get loadingMessage(): string;
    get loadingOperation(): string;
    get error(): string | null;
    get hasCards(): boolean;
    get cardCount(): number;

    loadDeck: (deckId: string) => Promise<boolean>;
    clearDeck: () => void;
    selectDeck: (deckId: string) => Promise<Boolean>;
    createDeck: (title: string) => Promise<boolean>;
    createNewDeck: () => Promise<Deck | null>;
    duplicateDeck: (newTitle?: string) => Promise<boolean>;
    duplicateDeckById: (deckId: string, newTitle?: string) => Promise<Deck | null>;
    updateDeckMeta: (updates: Partial<Deck['meta']>) => Promise<boolean>;
    importDeck: (deck: Deck) => Promise<boolean>;
    loadMostRecent: () => Promise<boolean>;

    setLoading: (isLoading: boolean, message?: string, operation?: string) => void
    setError: (error: string) => void;
    handleError: (err: unknown, fallbackMessage: string) => void;
    clearError: () => void;

    getCard: (cardId: string) => Card | null;
    addCard: (cardData?: Partial<Card>) => Promise<Card | null>;
    removeCard: (cardId: string) => Promise<boolean>
    duplicateCard: (cardId: string) => Promise<Card | null>;
    updateCard: (
        cardId: string,
        updates: Partial<Card>,
        message: string
    ) => Promise<boolean>;

    updateLayout: (layout: Layout) => Promise<boolean>;

    publishDeck: (options: {
        description?: string;
        tags?: string[];
        visibility?: 'public' | 'unlisted';
    }) => Promise<{ success: boolean; slug?: string; error?: string }>;
};