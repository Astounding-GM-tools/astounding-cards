# AI Migration Inventory

**Created**: 2025-11-16  
**Status**: Planning Phase

## Overview

This document inventories existing AI components and outlines the migration from BYOK (Bring Your Own Key) to server-side AI with token-based payments.

---

## Current State

### ✅ Server-Side Infrastructure (Complete)

#### Token Economy

- **API Routes**:
  - `/api/tokens/balance` - Get user token balance
  - `/api/tokens/dev-add` - Add tokens (dev only)
- **Database**:
  - `users.credits` column
  - `transactions` table for tracking
  - `grant_welcome_bonus()` trigger (500 tokens on signup)
- **Config**: `src/lib/config/token-costs.ts`
- **Stores**: `src/lib/next/stores/tokenBalance.ts`

#### Image Generation API

- **File**: `src/routes/api/ai/generate-image/+server.ts`
- **Status**: ⚠️ PARTIALLY COMPLETE
- **What it does**:
  - 2-step optimization (text → visual prompt → image)
  - Returns base64 image data
  - Supports existing image as style reference
  - Uses layout reference PNG for composition
- **What's missing**:
  - ❌ R2 upload
  - ❌ Database tracking in `community_images`
  - ❌ Token deduction
  - ❌ Check for existing remix
  - ❌ Generate embedding (for originals)
  - ❌ Transaction recording

#### Deck Generation API

- **File**: `src/routes/api/ai/generate-deck/+server.ts`
- **Status**: ✅ COMPLETE (for its purpose)
- **What it does**:
  - Generates full deck from theme/prompt
  - Returns deck JSON to client
  - Uses existing `generateDeckFromPrompt()` logic
- **Note**: Deck persistence happens client-side in IndexedDB initially, publishing to Supabase comes later

#### Community Image Library Schema

- **File**: `supabase/migrations/002_community_images.sql`
- **Tables**: `community_images` with pgvector
- **Features**:
  - Vector embeddings (768-dim) for semantic search
  - Remix tracking (`source_image_id`)
  - Helper functions: `find_image_remix()`, `search_similar_images()`

---

### 🆕 New Components (With Storybook Stories)

#### 1. AiImageGenerationDialog.svelte

- **Path**: `src/lib/next/components/dialogs/AiImageGenerationDialog.svelte`
- **Storybook**: `AiImageGenerationDialog.stories.ts`
- **Status**: ✅ READY FOR INTEGRATION
- **Features**:
  - Token balance display with affordability check
  - Auth gate (requires login)
  - Image style selector
  - Community generation info panel
  - Buy tokens CTA when insufficient funds
  - Calls `/api/ai/generate-image`
- **TODO**:
  - Handle R2 URL response (instead of base64)
  - Update card with generated image
  - Show "cached" indicator if remix exists
  - Integrate with deck store for card updates

#### 2. BatchImageGenerationDialog.svelte

- **Path**: `src/lib/next/components/dialogs/BatchImageGenerationDialog.svelte`
- **Status**: ⚠️ NEEDS MIGRATION
- **Current behavior**: Uses BYOK via `AiImageGenerator` class
- **Features**:
  - Staggered generation (2s delay between cards)
  - Progress toasts for each card
  - Art style selection
  - Error handling with detailed messages
- **TODO**:
  - Remove `ApiKeyInput` component usage
  - Switch to server-side `/api/ai/generate-image`
  - Add token balance check before starting
  - Show total cost upfront (100 tokens × card count)
  - Block if insufficient tokens

#### 3. AuthGatedCtaButton.svelte

- **Path**: `src/lib/next/components/cta/AuthGatedCtaButton.svelte`
- **Storybook**: `AuthGatedCtaButton.stories.ts`
- **Status**: ✅ READY TO USE
- **Purpose**: Reusable button that shows auth gate or token requirement

---

### 🗑️ BYOK Components (To Be Removed/Replaced)

#### 1. AiPromptDialog.svelte

- **Path**: `src/lib/next/components/dialogs/AiPromptDialog.svelte`
- **Current behavior**:
  - Takes theme + card count
  - Shows `ApiKeyInput` for BYOK
  - Calls `generateDeckWithToasts()` client-side
  - Imports deck to IndexedDB
- **Replacement strategy**:
  - Replace with server-side `/api/ai/generate-deck` call
  - Add auth gate
  - Add token cost display (FREE for deck generation)
  - Remove `ApiKeyInput` completely

#### 2. AiImagePromptDialog.svelte

- **Path**: `src/lib/next/components/dialogs/AiImagePromptDialog.svelte`
- **Current behavior**:
  - Generates image prompt from card
  - Optional: process prompt with Gemini to avoid content filters
  - Copies prompt to clipboard
- **Decision needed**: Keep or remove?
  - Option A: Remove entirely (users generate images directly)
  - Option B: Keep as "copy prompt for external tools" feature

#### 3. ApiKeyInput.svelte

- **Path**: `src/lib/next/components/ui/ApiKeyInput.svelte`
- **Status**: 🗑️ REMOVE COMPLETELY
- **Used by**:
  - `BatchImageGenerationDialog.svelte`
  - `AiPromptDialog.svelte`
  - `AiImagePromptDialog.svelte` (optional section)

#### 4. AiImageGenerator class

- **Path**: `src/lib/utils/ai-image-generator.ts`
- **Status**: 🗑️ REMOVE COMPLETELY
- **Used by**:
  - `BatchImageGenerationDialog.svelte`
  - `CardEditDialog.svelte` (needs checking)
- **Current behavior**:
  - Client-side image generation with user's API key
  - 2-step optimization + generation
  - Auto-downloads images

---

## Integration Points

### CardEditDialog.svelte

- **Path**: `src/lib/next/components/dialogs/CardEditDialog.svelte`
- **Current state**: Likely uses BYOK for image generation
- **TODO**: Check if it imports/uses `AiImageGenerator`
- **Action**: Replace with new `AiImageGenerationDialog`

### DeckManagerDialog.svelte

- **Path**: `src/lib/next/components/dialogs/DeckManagerDialog.svelte`
- **Action**: Ensure it uses new AI generation dialogs

---

## Migration Tasks (Priority Order)

### Phase 1: Complete Server-Side Infrastructure

**Priority**: 🔥 HIGH

1. **Complete Image Generation Flow** (NEXT_STEPS.md #1)
   - Add R2 upload helper
   - Generate embeddings for originals
   - Save to `community_images` table
   - Deduct tokens atomically
   - Record transaction
   - Check for existing remix first
   - Return R2 URL instead of base64

2. **Create Database Functions** (NEXT_STEPS.md #3)
   - `deduct_tokens(user_id, amount)` - atomic token deduction
   - Add to `supabase/migrations/003_token_functions.sql`

3. **Create Image Search API** (NEXT_STEPS.md #2)
   - `/api/images/search` - semantic search for similar images
   - Show before generation to avoid duplicates

---

### Phase 2: Update UI Components

**Priority**: 🔥 HIGH

4. **Integrate AiImageGenerationDialog**
   - Update to handle R2 URLs (not base64)
   - Connect to deck store for card updates
   - Show "cached" indicator for remixes
   - Add image search before generation (optional)

5. **Migrate BatchImageGenerationDialog**
   - Remove `ApiKeyInput` usage
   - Switch to `/api/ai/generate-image`
   - Add total cost display (e.g., "Generate 8 images - 800 tokens")
   - Check token balance before starting
   - Update UI to show token cost per card

6. **Replace AiPromptDialog**
   - Remove BYOK flow
   - Add auth gate
   - Call `/api/ai/generate-deck`
   - Show "FREE" indicator for deck generation
   - Keep existing import flow

---

### Phase 3: Clean Up BYOK Components

**Priority**: 🟡 MEDIUM

7. **Remove BYOK Components**
   - Delete `ApiKeyInput.svelte`
   - Delete `AiImageGenerator.ts`
   - Delete or repurpose `AiImagePromptDialog.svelte`

8. **Update CardEditDialog**
   - Replace BYOK image generation with `AiImageGenerationDialog`
   - Test integration

---

## Testing Strategy

### Unit Tests

- Token balance calculations
- Affordability checks
- Auth gate logic

### E2E Tests

- Image generation flow (auth → generate → deduct tokens)
- Insufficient tokens flow
- Batch generation with token tracking
- Deck generation (free)

### Manual Testing

- Generate image with sufficient tokens ✓
- Generate image with insufficient tokens ✓
- Batch generate with mixed success/failures ✓
- Check token balance updates ✓
- Verify R2 upload and URL ✓
- Test remix detection (same prompt + style) ✓

---

## Success Criteria

✅ All AI generation uses server-side endpoints  
✅ No BYOK components remain  
✅ Token balance updates correctly  
✅ Images stored in R2 and tracked in database  
✅ Transaction history shows all generations  
✅ Auth gate blocks unauthenticated users  
✅ Insufficient tokens shows "Buy tokens" CTA  
✅ Remix detection avoids duplicate costs  
✅ E2E tests pass for all flows

---

## Notes

- **Deck generation is FREE** - gateway to image sales
- **Image generation costs 100 tokens (1 NOK)** - 96% margin
- **Remix to different style is FREE** - encourages style exploration
- **Server-side only** - no API key leakage, controlled costs
- **Community library** - shared images reduce generation costs over time

---

## Next Session

**Start with**: Phase 1, Task 1 (Complete Image Generation Flow)  
**See**: `docs/NEXT_STEPS.md` for detailed implementation guide
