# Monetization & Public Gallery Implementation Plan

## Overview

Transform Astounding Cards from a local-first BYOK tool into a monetized platform with viral gallery features, while maintaining backward compatibility and offline-first core functionality.

## Business Model

### Value Proposition

- **No subscriptions** - pay only for what you create
- **Booster pack pricing** - 10-30 NOK for custom card decks (vs 40-60 NOK for physical boosters)
- **Viral content multiplication** - remixes generate revenue and marketing

### Revenue Streams

1. **À la carte deck generation** (convenience pricing)
2. **Token pack sales** (bulk discount, better margins)
3. **Future: Gift cards & affiliate sales** (Phase 2)

## Pricing Model

### Astounding Token Economy

- **100 tokens = 1 NOK** (simple mental model)
- **Text generation: FREE** for first 5 decks per day (costs us ~0.01 NOK per deck - loss leader)
  - After daily limit: 100 tokens per deck (1 NOK)
  - BYOK users: unlimited free (they use their own key)
- **Image generation: 50 tokens per image** (0.50 NOK)

### À la carte Pricing (Convenience)

```
8-card deck:   20 NOK  (400 tokens worth of images)
10-card deck:  25 NOK  (500 tokens worth of images)
12-card deck:  30 NOK  (600 tokens worth of images)

After Lemon Squeezy fees (5% + 5.50 NOK):
- 20 NOK → ~13 NOK net → ~9 NOK profit
- 25 NOK → ~18 NOK net → ~14 NOK profit
```

### Token Packs (Smart Buyer)

**Base: 50 NOK per pack = 5,000 tokens**

Volume discounts (5% per pack, max 40%):

```
1 pack:  50 NOK   (0% off)  = 5,000 tokens   (~12 decks)
2 packs: 95 NOK   (5% off)  = 10,000 tokens  (~25 decks)
3 packs: 135 NOK  (10% off) = 15,000 tokens  (~37 decks)
5 packs: 200 NOK  (20% off) = 25,000 tokens  (~62 decks)
8 packs: 240 NOK  (40% off) = 40,000 tokens  (~100 decks)
```

### User Tiers

**Tier 0 - BYOK (Bring Your Own Key)**

- Current functionality, remains free
- User provides Gemini API key
- Generates unlimited content at their cost
- We get free marketing from shared content
- **Keep this!** It's our community building tool

**Tier 1 - Public (Subsidized Marketing)**

- Text generation: FREE (we eat ~0.01 NOK cost)
- Images: 50 tokens each (0.50 NOK)
- Watermarked: "Made with Astounding.games"
- Auto-published to public gallery
- Content hosted on our servers (Vercel Blob / Cloudflare R2)
- **This is our viral engine**

**Tier 2 - Private (Premium - Phase 2)**

- Text generation: FREE
- Images: 400 tokens each (4.00 NOK)
- No watermark
- Stored in browser only (IndexedDB)
- Not published to gallery
- **Phase 2 feature**

## Architecture Changes

### Current State (Client-Only)

- 100% local-first (IndexedDB)
- URL-based sharing with base64 JSON
- All data in browser
- Zero backend costs

### Phase 1 Target (Hybrid)

- **Keep local-first for backward compatibility**
- Add optional backend for monetized features
- Dual data model: local + remote

### Tech Stack Additions

**Backend:**

- SvelteKit API routes (already available)
- Vercel deployment (already using)

**Database:**

- Supabase (Postgres + Auth)
- Free tier sufficient for MVP

**Payment:**

- Lemon Squeezy (5% + $0.50 per transaction)
- Simpler than Stripe for SaaS/digital goods

**Image Storage:**

- Vercel Blob (simple integration, good for MVP)
- Future: Cloudflare R2 (cheaper at scale)

### Database Schema

```sql
-- Users and authentication
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 0,
  daily_free_decks_used INTEGER DEFAULT 0,
  daily_free_decks_reset_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Published decks (public gallery)
published_decks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  slug TEXT UNIQUE, -- for clean URLs
  name TEXT NOT NULL,
  description TEXT,
  card_count INTEGER,
  data_json JSONB NOT NULL, -- full deck data
  visibility TEXT DEFAULT 'public', -- 'public' | 'unlisted'
  parent_deck_id UUID REFERENCES published_decks(id), -- for remixes (Phase 2)
  remix_count INTEGER DEFAULT 0, -- track derivatives (Phase 2)
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Generated images
generated_images (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES published_decks(id),
  card_id TEXT NOT NULL, -- local card ID
  url TEXT NOT NULL, -- Vercel Blob / R2 URL
  prompt_hash TEXT, -- dedupe identical prompts
  gemini_model TEXT,
  tier TEXT, -- 'public' | 'private'
  created_at TIMESTAMP DEFAULT NOW()
)

-- Transactions
transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- 'purchase' | 'usage' | 'refund'
  amount_nok DECIMAL(10,2), -- null for usage
  credits_delta INTEGER, -- positive for purchase, negative for usage
  description TEXT,
  lemon_squeezy_order_id TEXT UNIQUE,
  status TEXT DEFAULT 'completed', -- 'pending' | 'completed' | 'failed'
  created_at TIMESTAMP DEFAULT NOW()
)
```

### API Routes (SvelteKit)

```
/api/auth/signup              POST   Create account
/api/auth/login               POST   Login
/api/auth/session             GET    Check session

/api/credits/balance          GET    Get user's token balance
/api/credits/purchase-webhook POST   Lemon Squeezy webhook

/api/generate/text            POST   Generate deck text (FREE)
/api/generate/image           POST   Generate single card image

/api/deck/publish             POST   Publish deck to gallery
/api/deck/[id]                GET    Fetch published deck
/api/gallery                  GET    Browse public decks (paginated)
```

### Image Generation Flow

**Public Tier:**

```
1. User clicks "Generate Images" (à la carte or using tokens)
2. Check credits / process payment
3. POST /api/generate/image { cardData, tier: 'public' }
4. Server:
   - Calls Gemini API (our key)
   - Applies watermark (Canvas/sharp)
   - Uploads to Vercel Blob
   - Returns URL
5. Client stores URL in card.image
6. Deck can be published to gallery
```

**BYOK (Current behavior, keep it):**

```
1. User provides their Gemini key
2. Client calls Gemini directly OR via API with { apiKey: userKey }
3. Returns blob/URL
4. Free for us, free for them
5. Can still publish to gallery (encourages sharing)
```

## Phase 1: Core Monetization (4-6 weeks)

### Week 1: Backend Infrastructure

- [ ] Set up Supabase project
- [ ] Implement database schema
- [ ] Add Supabase Auth (email/password)
- [ ] Create basic API routes structure
- [ ] Add environment variables for API keys

### Week 2: Payment Integration

- [ ] Set up Lemon Squeezy account
- [ ] Create "Token Pack" product (50 NOK base)
- [ ] Implement volume discount calculator
- [ ] Create checkout flow (quantity selector)
- [ ] Implement webhook handler for credits
- [ ] Add credits balance UI (top nav bar)

### Week 3: AI Generation Backend

- [ ] Move Gemini text generation to `/api/generate/text`
- [ ] Implement `/api/generate/image` endpoint
- [ ] Add watermarking for public tier (sharp/canvas)
- [ ] Integrate Vercel Blob storage
- [ ] Add credit deduction logic
- [ ] Keep BYOK option (optional apiKey parameter)

### Week 4: Deck Publishing & Gallery

- [ ] Implement `/api/deck/publish` endpoint
- [ ] Create gallery page (`/gallery`)
- [ ] Add deck browsing (grid view, pagination)
- [ ] Implement clean share URLs (`/d/[slug]`)
- [ ] Add "Fork to Local" button (copies to IndexedDB)
- [ ] Support old URL format (backward compatible)

### Week 5: UI/UX Polish

- [ ] À la carte checkout flow
- [ ] Token pack purchase flow with volume discounts
- [ ] Credits balance indicator
- [ ] "Generate Images" pricing display
- [ ] Gallery filters (new, popular, most viewed)
- [ ] Deck preview cards

### Week 6: Testing & Launch

- [ ] Test payment flows (sandbox)
- [ ] Test image generation (public tier)
- [ ] Test deck publishing & gallery
- [ ] Verify backward compatibility (old URLs work)
- [ ] Load testing
- [ ] Security audit (API keys, payments)
- [ ] Soft launch to existing users

## Phase 2: Viral Features (Future)

### Remix System

- [ ] Parent/child deck relationships
- [ ] "Remix this deck" button
- [ ] Automatic attribution
- [ ] Remix counter on original decks
- [ ] Gallery filter: "Show remixes"

### Gift Cards & Distribution

- [ ] Code redemption system
- [ ] Lemon Squeezy license keys integration
- [ ] Physical gift card design
- [ ] Retail partnerships (game stores)

### Private Tier

- [ ] Private deck tier (400 tokens per image)
- [ ] No watermark
- [ ] Keep images in IndexedDB only
- [ ] Commercial use license

### Advanced Features

- [ ] User profiles
- [ ] Follow creators
- [ ] Deck collections
- [ ] Advanced moderation tools
- [ ] Analytics dashboard

## Migration Strategy

### Backward Compatibility

- **Old users with local decks:** Continue working exactly as before
- **Old share URLs (`#data=...`):** Still functional
- **BYOK:** Remains available and encouraged
- **No forced accounts:** Can still use app locally without auth

### Gradual Opt-In

1. User visits site → works as before (local-first)
2. "New: Generate decks with AI for free!" banner → tries text generation
3. Sees placeholder images → "Add images (20 NOK)" button
4. Creates account → makes first purchase
5. Discovers gallery → shares their deck
6. **Conversion complete**

## Cost Analysis

### Per-User Costs (Public Tier)

**8-card deck with images:**

- Text generation: 0.01 NOK (Gemini API)
- 8 images @ 0.40 NOK: 3.20 NOK (Gemini Imagen)
- Storage (500KB × 8): ~0.001 NOK/month (Vercel Blob)
- Hosting/bandwidth: ~0.01 NOK
- **Total cost: ~3.22 NOK**

**Revenue:**

- À la carte: 20 NOK → ~13 NOK after fees → **9.78 NOK profit (75% margin)**
- Token pack: 400 tokens = 4 NOK → **0.78 NOK profit per deck (20% margin)**

**Break-even:** ~3.22 NOK per deck (well below all pricing tiers)

### Hosting Costs (Estimated)

**Vercel (current):**

- Free tier: 100GB bandwidth, 6,000 minutes compute
- Should handle 1,000+ users/month free
- Pro plan ($20/month) for scaling

**Supabase:**

- Free tier: 500MB database, 2GB bandwidth
- Should handle 10,000+ decks free
- Pro plan ($25/month) for scaling

**Image Storage:**

- Vercel Blob: $0.15/GB/month storage + $0.10/GB bandwidth
- 1,000 public decks @ 4MB each = 4GB = ~$0.60/month storage
- Bandwidth costs scale with views

**Scale estimates:**

- 0-1,000 users: ~$0/month (all free tiers)
- 1,000-10,000 users: ~$50/month (Vercel + Supabase Pro)
- 10,000+ users: Consider Cloudflare R2 migration (10x cheaper storage)

## Success Metrics

### Phase 1 Goals (First 3 months)

- 100 paid users
- 500 published decks in gallery
- 5,000 NOK revenue
- 50% of new users try free text generation
- 10% conversion to paid

### Long-term Goals (Year 1)

- 1,000 paid users
- 10,000 published decks
- 100,000 NOK revenue
- Remix feature driving 30% of content
- Gift card retail partnerships

## Risk Mitigation

### Payment Fraud

- Lemon Squeezy handles fraud detection
- Rate limiting on image generation (50/day per user)
- Monitor for bulk account creation

### Content Moderation

- Gemini has built-in content filters (SFW)
- Report button on gallery decks
- Admin review queue (Phase 2)

### Text Generation Abuse Prevention

**Free Tier Limits (logged-in users):**

- 5 free deck generations per day
- After limit: charge tokens (100 tokens per deck)
- Resets at midnight UTC
- BYOK users: unlimited (they pay their own costs)

**Implementation:**

```typescript
// Track in database
users (
  ...,
  daily_free_decks_used INTEGER DEFAULT 0,
  daily_free_decks_reset_at TIMESTAMP
)

// Before generating
if (user.daily_free_decks_used >= 5 && !apiKey) {
  // Check if user has tokens
  if (user.credits < 100) {
    return { error: 'Daily limit reached. Buy tokens or use your own API key.' }
  }
  // Deduct 100 tokens
  await deductCredits(user.id, 100, 'deck_generation')
} else if (!apiKey) {
  // Increment free usage counter
  await incrementDailyFreeDecks(user.id)
}
```

**User messaging:**

```
You've used 3/5 free deck generations today
→ 2 more free decks today
→ After that: 100 tokens per deck (1 NOK)
→ Or use your own Gemini key (unlimited)
```

### Image Generation (Self-Limiting)

- No rate limits needed - users pay for every image
- Natural abuse prevention through cost
- Optional: soft cap at 100 images/day with warning (prevent accidents)

### API Cost Runaway

- Daily spend cap on Gemini API: 1,000 NOK
- Alert if costs exceed 50% of revenue
- Monitor for suspicious patterns (same prompt 100x)

### Refund Requests

- "No refunds" policy (digital goods consumed immediately)
- À la carte: images delivered instantly
- Token packs: like gift cards, no expiry, no refunds
- EU consumer law: digital content exception applies

## Open Questions

1. **Watermark design:** Text overlay for MVP, or need branded asset?
2. **Free credits on signup:** Give 100 tokens (2 images) to try? Or purely paid?
3. **Rate limiting:** 50 images/day feels generous but prevents abuse?
4. **Image retention:** Keep public images forever, or archive after 1 year?
5. **Private tier timing:** Include in Phase 1 or defer to Phase 2?

## Implementation

**GitHub Issue:** [#13 - Phase 1: Public Gallery, Curated Decks & Monetization](https://github.com/Astounding-GM-tools/astounding-cards/issues/13)

This plan has been consolidated with the Curated Decks feature (#11) into a single super-task.

**Implementation Strategy:**

- **Phase 1A (Weeks 1-2):** Gallery infrastructure & three-layer merge
- **Phase 1B (Weeks 3-4):** User accounts & deck publishing
- **Phase 1C (Weeks 5-6):** AI generation & monetization

See issue #13 for detailed week-by-week checklist.

---

**Last Updated:** 2025-01-14  
**Status:** Ready to Begin Phase 1A  
**Target Launch:** Phase 1 in 6 weeks
