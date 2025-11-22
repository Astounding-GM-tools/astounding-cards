# Semantic Image Search Implementation

## Overview

This feature enables users to find and reuse existing AI-generated images from the community library based on semantic similarity to their card content. This saves tokens and promotes community sharing.

## User Experience

**Trigger Points:**
1. Card Edit Dialog (InlineImageSelector)
2. Batch Image Generation Dialog

**Flow:**
1. User clicks "Browse Similar Images" button
2. System generates embedding from card content (title, subtitle, description, traits)
3. Searches `community_images` table for semantically similar images
4. Shows top 10 results in a dialog:
   - Each image family shown with primary style variant
   - Style variants grouped below (clickable to preview)
   - "Use This" button to apply image
5. Clicking image opens full preview (reused from batch generation)
6. Selecting image closes dialog and applies to card

**Button Behavior:**
- Shows count: "Browse 8 Similar Images (Free)"
- Hidden/disabled if 0 similar images found
- Uses Action Button design (like image generation CTA)

## Architecture

### Database Schema (Already Exists ✅)

**`community_images` table:**
```sql
- embedding vector(768) -- 768-dimensional vector from optimized prompt
- source_image_id UUID  -- NULL for originals, links remixes
- style TEXT            -- 'classic', 'modern', 'inked'
```

**Vector Index:**
```sql
CREATE INDEX idx_community_images_embedding
  ON community_images USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Search Function (Already Exists ✅):**
```sql
search_similar_images(
  p_query_embedding vector(768),
  p_preferred_style TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  original_id UUID,
  original_url TEXT,
  original_style TEXT,
  variants JSONB,        -- Array of style variants
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
```

### Type Definitions (Already Updated ✅)

**Card Type:**
```typescript
interface Card {
  // ... existing fields
  embedding?: number[] | null;  // 768-dimensional vector
  embeddingContentHash?: string | null;  // For change detection
}
```

**DeckMeta Type:**
```typescript
interface DeckMeta {
  // ... existing fields
  embedding?: number[] | null;  // 768-dimensional vector
  embeddingContentHash?: string | null;  // For change detection
}
```

### Utilities (Already Created ✅)

**`src/lib/utils/card-embeddings.ts`:**
- `cardToSemanticText(card)` - Converts card to semantic text
- `generateContentHash(text)` - SHA-256 hash for change detection
- `shouldRegenerateEmbedding(card)` - Checks if embedding is stale
- `generateCardEmbedding(card)` - Generates via API
- `ensureCardEmbedding(card)` - Updates if needed

**Semantic Text Format:**
```
Title: [card.title]
Type: [card.subtitle]
Description: [card.description]
Traits: [trait.title]: [trait.description]; ...
```

**Note:** Only includes semantic content (title, subtitle, description, traits)
- Excludes stats (mechanical, not visual)
- Excludes image metadata (not relevant to content)

### API Endpoints

#### 1. Generate Embedding (Already Created ✅)

**Endpoint:** `POST /api/ai/generate-embedding`

**Purpose:** Generate 768-dimensional vector from text

**Request:**
```typescript
{
  text: string;  // Semantic text from card
}
```

**Response:**
```typescript
{
  success: true,
  embedding: number[],  // 768-dimensional vector
  dimensions: number    // Should be 768
}
```

**Authentication:** Required (bearer token)

**Cost:** Very cheap (~$0.000025 per embedding with Gemini text-embedding-004)

**Pricing Reference (Gemini text-embedding-004):**
- Input: $0.00001 per 1,000 characters
- For typical card (~200 chars): $0.000002
- 1,000 card embeddings: ~$0.002

#### 2. Search Similar Images (TO IMPLEMENT)

**Endpoint:** `POST /api/ai/search-similar-images`

**Purpose:** Find semantically similar images using card embedding

**Request:**
```typescript
{
  cardId: string;           // Card to search for (uses its embedding)
  // OR
  embedding: number[];      // Direct embedding (if card not saved yet)

  preferredStyle?: string;  // 'classic', 'modern', 'inked' (prioritizes this style)
  limit?: number;           // Max results (default: 10)
}
```

**Response:**
```typescript
{
  success: true,
  results: Array<{
    originalId: string;
    originalUrl: string;
    originalStyle: string;
    variants: Array<{
      id: string;
      url: string;
      style: string;
      createdAt: string;
    }>;
    similarity: number;     // 0-1, higher is better
    createdAt: string;
  }>;
  totalFound: number;
}
```

**Implementation Steps:**
1. Get card embedding (from request or generate on-the-fly)
2. Call Supabase `search_similar_images()` function
3. Return top 10 image families with variants
4. Prioritize variants matching `preferredStyle`

**Example Flow:**
```typescript
// 1. Get card embedding
const card = await nextDb.getCard(cardId);
let embedding = card.embedding;

if (!embedding) {
  // Generate on-the-fly if missing
  const { embedding: newEmbedding } = await generateCardEmbedding(card);
  embedding = newEmbedding;
}

// 2. Search Supabase
const { data } = await supabaseAdmin.rpc('search_similar_images', {
  p_query_embedding: `[${embedding.join(',')}]`,
  p_preferred_style: preferredStyle,
  p_limit: limit
});

// 3. Format and return results
return json({ success: true, results: data, totalFound: data.length });
```

### UI Components

#### 1. Image Preview Component (TO EXTRACT)

**Component:** `ImagePreviewModal.svelte` (extract from batch generation)

**Purpose:** Reusable full-screen image preview

**Props:**
```typescript
{
  imageUrl: string;
  onClose: () => void;
}
```

**Features:**
- Full-screen overlay
- Click outside to close
- ESC key to close
- High-quality image display

**Location to Extract From:**
- `AiBatchImageGenerationDialog.svelte` has preview logic
- Extract to `src/lib/next/components/ui/ImagePreviewModal.svelte`

#### 2. Similar Images Dialog (TO CREATE)

**Component:** `SimilarImagesDialog.svelte`

**Purpose:** Show search results with style variants

**Props:**
```typescript
{
  cardId: string;           // Card to search for
  currentStyle?: string;    // Current deck image style (for prioritization)
  onImageSelected: (imageUrl: string, imageId: string, style: string) => void;
}
```

**Layout:**
```
┌─────────────────────────────────────────┐
│  Similar Images for "Card Title"        │
│  Found 8 matching images                │
├─────────────────────────────────────────┤
│                                          │
│  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │ IMG 1 │  │ IMG 2 │  │ IMG 3 │       │  <- Main images (in preferred style if available)
│  │Classic│  │Modern │  │ Inked │       │
│  └───────┘  └───────┘  └───────┘       │
│  [Classic] [Modern] [Inked]             │  <- Style variant chips (smaller)
│  [Use This Image]                       │
│                                          │
│  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │ IMG 4 │  │ IMG 5 │  │ IMG 6 │       │
│  └───────┘  └───────┘  └───────┘       │
│  ...                                    │
└─────────────────────────────────────────┘
```

**Features:**
- Grid of thumbnails (3-4 per row)
- Each image shows primary variant (preferred style or original)
- Style variant chips below each image (clickable)
- Click image to open full preview
- "Use This" button per image
- Shows similarity score? (optional - maybe not, users don't care)

**State Management:**
```typescript
let searchResults = $state<SearchResult[]>([]);
let isLoading = $state(true);
let selectedImage = $state<string | null>(null);  // For preview
```

**API Call:**
```typescript
async function loadSimilarImages() {
  isLoading = true;
  const response = await authenticatedFetch('/api/ai/search-similar-images', {
    method: 'POST',
    body: JSON.stringify({
      cardId,
      preferredStyle: currentStyle,
      limit: 10
    })
  });
  const data = await response.json();
  searchResults = data.results;
  isLoading = false;
}
```

#### 3. Browse Button in InlineImageSelector (TO ADD)

**Location:** `src/lib/next/components/image/InlineImageSelector.svelte`

**Placement:** Below the "Generate Image" button (or replace it temporarily)

**Button Design:**
```svelte
{#if similarImageCount > 0}
  <AuthGatedCtaButton
    config={{
      label: `Browse ${similarImageCount} Similar Images`,
      sublabel: 'Free - Reuse existing images',
      icon: 'search' // or gallery icon
    }}
    onAuthenticatedClick={openSimilarImagesDialog}
  />
{/if}
```

**Getting Count (Pre-check):**
```typescript
// On component mount or when card changes
async function checkSimilarImageCount() {
  if (!hasExistingImage) {
    const response = await authenticatedFetch('/api/ai/search-similar-images', {
      method: 'POST',
      body: JSON.stringify({ cardId, limit: 1 })  // Just check if any exist
    });
    const data = await response.json();
    similarImageCount = data.totalFound;
  }
}
```

**Alternative:** Don't pre-check, just always show the button. Loading state shows in dialog.

#### 4. Browse Button in Batch Generation Dialog (TO ADD)

**Location:** `src/lib/next/components/dialogs/AiBatchImageGenerationDialog.svelte`

**Placement:** At top of dialog, before card selection list

**Button Text:** "Browse Community Library" or "Find Similar Images for Selected Cards"

**Behavior:**
- Opens similar images dialog for first selected card
- Future: Could show aggregate results for multiple cards

## Implementation Plan

### Phase 1: Search API ✅ (IN PROGRESS)
- [x] Add embedding fields to Card and DeckMeta types
- [x] Create `card-embeddings.ts` utility
- [x] Create `/api/ai/generate-embedding` endpoint
- [ ] Create `/api/ai/search-similar-images` endpoint

### Phase 2: UI Components
- [ ] Extract `ImagePreviewModal.svelte` from batch generation dialog
- [ ] Create `SimilarImagesDialog.svelte`
  - Grid layout
  - Style variant display
  - Preview integration
  - "Use This" action

### Phase 3: Integration
- [ ] Add browse button to `InlineImageSelector.svelte`
  - Pre-check similar image count (or skip and show in dialog)
  - Open dialog on click
  - Handle image selection
- [ ] Add browse button to `AiBatchImageGenerationDialog.svelte`
  - Per-card search
  - Handle image selection

### Phase 4: Enhancement (Future)
- [ ] Deck embedding generation utility
- [ ] Automatic embedding updates on card edit (debounced)
- [ ] "Full Auto" deck generation with image suggestions
- [ ] Suggest similar cards to add to deck

## Cost Analysis

**Embedding Generation:**
- Gemini text-embedding-004: $0.00001 per 1K chars
- Typical card (~200 chars): ~$0.000002 per embedding
- 1,000 card embeddings: ~$0.002 (negligible!)

**Search:**
- Vector similarity search is database operation (no API cost)
- Uses pgvector extension with ivfflat index
- Very fast (< 100ms for 10K images)

**Comparison:**
- Image generation: ~$0.039 per image
- Embedding generation: ~$0.000002 per card
- **Embeddings are 19,500x cheaper than images!**

**User Benefit:**
- Finding and reusing existing image: FREE (0 tokens)
- Generating new image: 100 tokens ($0.10 user cost)
- Users save tokens, we save API costs, community library grows!

## Database Queries

### Check Similar Image Count
```sql
SELECT COUNT(*)
FROM (
  SELECT ci.id
  FROM community_images ci
  WHERE ci.embedding IS NOT NULL
  ORDER BY ci.embedding <=> '[your_embedding_vector]'::vector
  LIMIT 1
) AS results;
```

### Get Similar Images with Variants
```sql
SELECT * FROM search_similar_images(
  '[your_embedding_vector]'::vector,
  'classic',  -- preferred style
  10          -- limit
);
```

Returns:
```
original_id | original_url | original_style | variants | similarity | created_at
------------|--------------|----------------|----------|------------|------------
uuid-1      | https://...  | classic        | [...]    | 0.95       | 2024-...
uuid-2      | https://...  | modern         | [...]    | 0.89       | 2024-...
```

Variants JSONB format:
```json
[
  {
    "id": "uuid-variant-1",
    "url": "https://...",
    "style": "modern",
    "created_at": "2024-..."
  },
  {
    "id": "uuid-variant-2",
    "url": "https://...",
    "style": "inked",
    "created_at": "2024-..."
  }
]
```

## Testing Plan

### Unit Tests
- [ ] `cardToSemanticText()` produces consistent output
- [ ] `generateContentHash()` creates valid SHA-256 hashes
- [ ] `ensureCardEmbedding()` only regenerates when content changes

### API Tests
- [ ] `/api/ai/generate-embedding` requires auth
- [ ] Returns 768-dimensional vector
- [ ] Handles empty/long text appropriately
- [ ] `/api/ai/search-similar-images` returns correct format
- [ ] Prioritizes preferred style in results

### E2E Tests
- [ ] Browse button appears when similar images exist
- [ ] Dialog loads and displays results
- [ ] Clicking image opens preview
- [ ] "Use This" applies image and closes dialog
- [ ] Works in both card edit and batch generation

## Future Enhancements

1. **Automatic Embedding Updates:**
   - Debounced updates on card content changes
   - Background worker to update embeddings
   - Only regenerate when semantic content changes (not stats/images)

2. **Deck-Level Search:**
   - Aggregate embeddings from all cards
   - Find similar decks
   - Suggest cards to add to deck

3. **Full Auto Generation:**
   - Generate deck + automatically apply best matching images
   - User reviews and tweaks
   - One-click deck creation

4. **Community Contributions:**
   - Users can mark images as "good match" for cards
   - Improve search ranking over time
   - Build a collaborative image library

5. **Advanced Search:**
   - Filter by style
   - Filter by recency
   - Filter by creator
   - Text search with semantic fallback

## Files Modified/Created

### Created ✅
- `src/lib/utils/card-embeddings.ts` - Card embedding utilities
- `src/routes/api/ai/generate-embedding/+server.ts` - Embedding API
- `docs/SEMANTIC_IMAGE_SEARCH.md` - This document

### Modified ✅
- `src/lib/next/types/card.ts` - Added embedding fields
- `src/lib/next/types/deck.ts` - Added embedding fields
- `src/routes/api/ai/generate-image/+server.ts` - Re-enabled embedding generation
- `src/routes/api/ai/batch-generate-images/+server.ts` - Added embedding generation

### To Create
- `src/routes/api/ai/search-similar-images/+server.ts` - Search API
- `src/lib/next/components/ui/ImagePreviewModal.svelte` - Reusable preview
- `src/lib/next/components/dialogs/SimilarImagesDialog.svelte` - Search results

### To Modify
- `src/lib/next/components/image/InlineImageSelector.svelte` - Add browse button
- `src/lib/next/components/dialogs/AiBatchImageGenerationDialog.svelte` - Add browse button

## Summary

This feature creates a powerful, cost-effective way for users to discover and reuse community images. By using semantic embeddings, we can match card content to visually similar images without requiring exact keyword matches. This:

- **Saves users tokens** (free vs 100 tokens)
- **Saves us API costs** (no image generation)
- **Builds community** (shared image library)
- **Improves UX** (instant results vs 30s generation)
- **Enables future features** (card suggestions, deck matching)

The embeddings are extremely cheap to generate (~$0.000002 per card) and enable a much richer user experience than keyword-based search could provide.
