# AI Module Organization

This document describes the reorganized AI functionality in the Card Deck Creator.

## Issues Addressed

The original AI implementation had several problems:
1. **Hardcoded prompts** scattered across files
2. **Duplicate functions** between `gemini.ts` and other utilities
3. **Type warnings** about `GenerateContentParameters.generationConfig`
4. **Fixed card limit** of 8 cards, ignoring user input
5. **Poor organization** with AI logic mixed throughout the codebase

## New Structure

```
src/lib/ai/
├── index.ts                    # Main exports
├── config/
│   └── models.ts              # AI model configuration
├── prompts/
│   ├── deck-generation.ts     # Deck creation prompts & schema
│   └── content-filtering.ts   # Content filtering prompts
└── generators/
    └── gemini.ts             # Gemini AI implementation
```

## Key Features

### Centralized Configuration (`config/models.ts`)
- AI models defined in one place
- Configuration objects for different use cases
- Easy to update model versions

### Optimized Prompts (`prompts/`)
- **Streamlined Deck Generation**: Focuses only on content that matters
- **Content Filtering**: Helps bypass AI content filters  
- **Simplified JSON Schema**: Validates only essential fields
- **Flexible Card Count**: Supports 1-50 cards based on user input
- **Removed Unnecessary Fields**: No IDs, timestamps, or placeholder images

### Clean Generator Interface (`generators/gemini.ts`)
- **Structured JSON Output**: Uses `responseMimeType: 'application/json'` and `responseSchema` for reliable JSON generation
- **Proper TypeScript typing**: Uses type casting to handle SDK interface issues
- **Consistent return types**: `AIResult<T>` and `DeckGenerationResult`
- **Error handling**: Comprehensive error capture and reporting
- **Flexible card count**: Respects user's `cardCount` input (3-50 cards)

### Simple Import (`index.ts`)
```typescript
import { 
  generateDeckFromPrompt, 
  processPromptForContentFiltering,
  testGeminiConnection 
} from '$lib/ai/index.js';
```

## Usage

### Generate a Deck
```typescript
const result = await generateDeckFromPrompt(apiKey, "Greek Mythology", 12);
if (result.success) {
  // result.deck contains the generated deck
}
```

### Process Content for Filters
```typescript
const result = await processPromptForContentFiltering(apiKey, originalPrompt);
if (result.success) {
  // result.result contains the filtered prompt
}
```

### Test Connection
```typescript
const result = await testGeminiConnection(apiKey);
// Returns { success: boolean, result?: string, error?: string }
```

## Updated Components

The following components have been updated to use the new AI structure:
- `AiPromptDialog.svelte` - Main deck generation dialog
- `AiImagePromptDialog.svelte` - Image prompt generation dialog

## Benefits

1. **Better Organization**: AI functionality is now centralized and easy to find
2. **Type Safety**: Proper TypeScript interfaces with no warnings
3. **Flexibility**: Configurable card counts (3-50 cards)
4. **Maintainability**: Easy to update prompts and model configurations
5. **Consistency**: Unified error handling and return types
6. **Extensibility**: Easy to add new AI providers or prompt types

## Future Improvements

- Add support for other AI providers (OpenAI, Claude, etc.)
- Create prompt templates for different deck types
- Add caching for repeated requests
- Implement retry logic for failed requests
