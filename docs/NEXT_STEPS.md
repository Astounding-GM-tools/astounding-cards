# Next Steps: Image Library & Phase 1B Completion

**Last Updated**: 2025-11-16
**Current Status**: ✅ Server-side image generation COMPLETE with token economy, R2 storage, and database tracking. Ready for UI integration.

---

## What's Already Done ✅

### Token Economy (Complete)
- Token balance API: `/api/tokens/balance`, `/api/tokens/dev-add`
- Welcome bonus: 500 tokens via DB trigger (`grant_welcome_bonus()`)
- Token costs config: `src/lib/config/token-costs.ts`
- UI components: AiImageGenerationDialog, AuthGatedCtaButton
- Database: `users.credits`, `transactions` table

### Community Image Library Schema (Complete)
- Database table: `community_images` with pgvector
- Remix tracking: `source_image_id` for style variants
- Vector embeddings: 768-dim for semantic search (originals only)
- Helper functions: `find_image_remix()`, `search_similar_images()`
- Migration: `supabase/migrations/002_community_images.sql`

### Server-Side AI Generation ✅ COMPLETE
- `/api/ai/generate-image` - Full 12-step flow implemented
- ✅ Authentication required (Authorization header support)
- ✅ Remix detection (returns cached results, 0 cost)
- ✅ R2 upload with public URLs
- ✅ Database tracking in `community_images`
- ✅ Atomic token deduction via `deduct_tokens()` function
- ✅ Transaction recording
- ⚠️ Embeddings temporarily disabled (API format needs fixing)

### Strategic Decisions
- ❌ No user-uploaded images (copyright/liability)
- ✅ AI-generated only (safe, controlled)
- ✅ R2-only style references (no external images)
- ✅ Free deck generation (gateway to image sales)
- ✅ Gemini + Supabase pgvector (bundled, simple)

---

## Completed ✅

### 1. ✅ Image Generation Flow COMPLETE

**File**: `src/routes/api/ai/generate-image/+server.ts`

**Status**: DONE - All features implemented except embeddings

**Completed features**:
- ✅ Remix detection via `find_image_remix()`
- ✅ R2 upload with public URLs
- ✅ Database save to `community_images`
- ✅ Atomic token deduction via `deduct_tokens()`
- ✅ Transaction recording
- ✅ Returns R2 URL with metadata
- ⚠️ Embeddings (temporarily disabled - API format needs fixing)

**Created files**:
- `src/lib/server/embeddings.ts` - Embedding helper (needs API format fix)
- `src/lib/server/auth.ts` - Session validation with Authorization header support
- `src/routes/api/auth/create-user/+server.ts` - Auto-create user on signup
- `supabase/migrations/003_token_functions.sql` - Token deduction function

---

### 2. Create Image Search API 🔍 MEDIUM PRIORITY

**File**: `src/routes/api/images/search/+server.ts` (create new)

**Purpose**: Search for similar images by card content

**Flow**:
1. Accept card data (title, subtitle, description, traits)
2. Generate optimized prompt (same as image generation Step 1)
3. Generate embedding of optimized prompt
4. Call `search_similar_images(embedding, preferredStyle, limit)`
5. Return results with all style variants

**Request**:
```typescript
POST /api/images/search
{
  card: { title, subtitle, description, traits },
  preferredStyle: 'classic',
  limit: 10
}
```

**Response**:
```typescript
{
  results: [
    {
      originalId: uuid,
      originalUrl: string,
      originalStyle: 'classic',
      similarity: 0.89,
      variants: [
        { id: uuid, url: string, style: 'inked' },
        { id: uuid, url: string, style: 'modern' }
      ]
    }
  ]
}
```

---

### 3. ✅ Database Functions COMPLETE

**File**: `supabase/migrations/003_token_functions.sql`
**Status**: ✅ Created and applied

---

## Immediate Next Steps

### 1. ✅ UI Integration COMPLETE

**Status**: CardEditDialog integrated with new server-side API

**Completed**:
- ✅ Removed BYOK components (ApiKeyInput, AiImageGenerator)
- ✅ Added AuthGatedCtaButton with IMAGE_GENERATION_CTA config
- ✅ Opens AiImageGenerationDialog with current card data
- ✅ Dialog handles: auth gating, token balance, style selection
- ✅ Connected to `/api/ai/generate-image` endpoint
- ✅ Updates card with R2 URL via nextDeckStore.updateCard()
- ✅ Shows cached vs new image toasts
- ✅ Refreshes token balance after generation

**Remaining**:
- ⏳ BatchImageGenerationDialog integration (deck-level generation)
- ⏳ Remove unused BYOK components from codebase

**Optional enhancement**: Add image search before generation
- "Before generating, search for similar images?"
- Show results, let user choose existing or generate new

---

## Phase 1B Remaining Work

### Week 3: Content Moderation (SIMPLIFIED)

**File**: `src/lib/ai/prompts/content-moderation.ts` (create new)

**What's needed**:
1. Text-only moderation (no image moderation - Gemini handles that)
2. Block/warn/allow classification
3. Category and tag extraction
4. Store results in `published_decks.analysis` (JSONB)

**No image moderation needed** - AI images are safe by default!

### Week 4: Publishing Flow

**File**: `src/routes/api/deck/publish/+server.ts`

**Flow**:
1. Accept deck data with image URLs (from community_images)
2. Run text moderation
3. Save to `published_decks` table
4. Return preview with suggested warnings/tags

---

## Key Information

### Economics
- **Gemini image**: ~0.04 NOK cost → charge 100 tokens (1 NOK) → **96% margin**
- **Gemini embedding**: ~0.00005 NOK (negligible)
- **Breakeven**: ~50 images/month (covers $25 Supabase Pro)

### Important Files
- `src/lib/config/token-costs.ts` - Pricing constants
- `src/lib/config/cta-configs.ts` - CTA button configs
- `src/lib/next/stores/tokenBalance.ts` - Token balance store
- `src/routes/api/ai/generate-image/+server.ts` - Image generation (needs update)
- `src/routes/api/tokens/balance/+server.ts` - Balance API
- `supabase/migrations/002_community_images.sql` - Image library schema
- `docs/TOKENS_AND_PRICING.md` - Token system docs
- `docs/PHASE_1B_PLAN.md` - Overall plan

### Test Commands
```bash
# Dev: Add tokens to yourself
await fetch('/api/tokens/dev-add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 1000 })
}).then(r => r.json()).then(console.log)

# Check balance
await fetch('/api/tokens/balance').then(r => r.json()).then(console.log)
```

---

## Success Criteria

✅ User generates image → costs 100 tokens → saves to R2 → records in database
✅ User remixes to different style → finds existing → costs 0 tokens
✅ User searches for similar images → finds semantically related images
✅ Token balance updates correctly
✅ Transaction history shows all generations

**Next session: Start with #1 (Complete Image Generation Flow)!** 🚀
