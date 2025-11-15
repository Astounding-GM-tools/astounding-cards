# Phase 1B: User Accounts & Deck Publishing

## Progress: Week 1 Complete! 🎉

**Completed:**

- ✅ Week 1: Authentication (email/password + Google OAuth)

**Next:**

- 🔜 Week 2: Image Hosting (Vercel Blob)
- ⏳ Week 3: Content Moderation
- ⏳ Week 4: Publishing Flow

---

## Overview

Enable users to publish decks to Supabase with automated hosting, moderation, and classification.

## Key Features

### 1. Authentication

- Supabase Auth (email/password)
- Sign up / Sign in flows
- Session management

### 2. Image Hosting

- Automatic upload to **Cloudflare R2** on publish
- S3-compatible API with FREE storage (10GB) and FREE bandwidth
- Images stored permanently with global CDN delivery
- No more manual migration friction
- **Critical for adoption!**

### 3. Content Moderation & Classification

#### Two-Stage Moderation (Simplified):

**Stage 1: Text Analysis (~0.01 NOK)**

- Moderation (block/warn/allow)
- Classification (category, tags, themes)
- Quality scoring (0-10)
- Language detection
- Single Gemini call for all text content

**Stage 2: User Review**

- Preview with suggested content warnings
- User can: Accept & Publish, Edit & Re-check, Cancel
- Max 3 moderation attempts per publish (prevents cost abuse)

**No Image Moderation Needed:**

- Only AI-generated images are hosted on the platform
- Gemini has built-in safety filters
- Users cannot upload external images (copyright/content risk)
- Style references must be from our R2 bucket (already AI-generated)

#### Cost Breakdown:

```
Any deck (text only): 0.01 NOK
```

**Note:** Image generation is a separate paid feature (100 tokens/image)

### 4. Content Taxonomy

**See:** `/docs/DECK_EXAMPLES.md` for diverse examples
**Implementation:** `/src/lib/ai/prompts/content-moderation.ts`

**Categories:**

- RPG (D&D, Pathfinder, WFRP, generic, etc.)
- Educational (flashcards, study guides, reference)
- Recipes (cooking, drinks, meal prep)
- Humor (parody, fan-content, memes)
- Personal (collections, tracking, journaling)
- Business (frameworks, planning, productivity)
- Fitness (workouts, exercises, wellness)
- Travel (guides, planning, recommendations)
- Entertainment (movies, music, media)
- Collection (cataloging, organizing, tracking)
- Worldbuilding (lore, maps, history)
- Creative (prompts, inspiration, writing)

**Themes:**

- Fantasy, Sci-Fi, Cyberpunk, Horror
- Historical, Modern, Post-Apocalyptic
- Comedy, Dark, Whimsical
- Anime, Western, Noir, Mythology
- Nautical, Space Opera, Urban Fantasy
- Slice-of-life, Absurd, Parody
- Educational, Inspirational

**Content Types:**

- Characters, Locations, Items, Spells, Encounters
- Concepts, Quotes, Facts, Instructions, Prompts
- Lists, Profiles, Reviews, Comparisons, Timelines
- Recipes, Exercises, Vocabulary, Mixed

**Quality Flags:**

- high-effort, original-art, creative, detailed, comprehensive
- ai-generated, generic, procedural (for transparency)

### 5. Moderation Policy (RPG-Friendly)

**✅ ALLOWED:**

- Fantasy violence (swords, combat)
- Moderate sensuality (barbarians, seductive characters)
- Horror/scary themes (Lovecraftian, gothic)
- Alcohol/fantasy drugs

**⚠️ WARNED (tagged, still published):**

- Sexual content → `mature_sexual`
- Moderate violence → `mature_violent`
- Disturbing themes → `mature_disturbing`

**❌ BLOCKED:**

- Illegal content (CSAM, terrorism)
- Hate speech
- Extreme graphic violence
- Doxxing/harassment

### 6. Publishing Flow

```
User clicks "Publish Deck"
  ↓
Stage 1: Analyze text content
  ├─ ✅ Safe → Continue
  ├─ ⚠️  Warnings → Show preview with tags
  └─ ❌ Blocked → Reject with reason
  ↓
Show preview with:
  - Suggested content warnings
  - Category and tags
  - Quality score
  - [Accept & Publish] [Edit & Re-check] [Cancel]
  ↓
Save to Supabase with:
  - AI-generated image URLs (R2)
  - Content warnings
  - Categories and tags
  - Quality score
  - AI analysis metadata
```

### 7. Image Strategy

**What's Allowed:**

- ✅ AI-generated images (via our platform)
- ✅ Images from community library (already on R2)
- ✅ Local images (browser only, not published)
- ✅ URL-based images (not hosted by us, user's responsibility)

**What's NOT Allowed:**

- ❌ User-uploaded images to our hosting
- ❌ External images as AI style references

**Style Reference System:**

- Users can use R2-hosted images as style references
- When remixing decks, existing images in different styles may already exist
- Future: Check media library for style+prompt matches before generating
- This builds a reusable style library and saves generation costs

### 8. Database Updates

```sql
-- Add to published_decks table
ALTER TABLE published_decks ADD COLUMN content_warnings TEXT[];
ALTER TABLE published_decks ADD COLUMN category TEXT;
ALTER TABLE published_decks ADD COLUMN tags TEXT[];
ALTER TABLE published_decks ADD COLUMN themes TEXT[];
ALTER TABLE published_decks ADD COLUMN language TEXT DEFAULT 'en';
ALTER TABLE published_decks ADD COLUMN ai_quality_score INTEGER;
ALTER TABLE published_decks ADD COLUMN is_editors_pick BOOLEAN DEFAULT FALSE;
ALTER TABLE published_decks ADD COLUMN estimated_age TEXT;
ALTER TABLE published_decks ADD COLUMN moderation_checks INTEGER DEFAULT 0;
ALTER TABLE published_decks ADD COLUMN analysis JSONB;
```

### 9. API Routes

```
POST /api/auth/signup          - Create account
POST /api/auth/login           - Login
GET  /api/auth/session         - Check session

POST /api/deck/publish         - Publish deck (with moderation)
POST /api/deck/moderate        - Re-check content (after edits)
GET  /api/deck/[id]            - Fetch published deck (already exists)
```

## Implementation Checklist

### Week 1: Auth & Infrastructure ✅ COMPLETE

- [x] Set up Supabase Auth
- [x] Add sign up / sign in UI
- [x] Session management
- [x] Update Header with auth state
- [ ] Protected API routes (Week 3 - needed for publishing)

### Week 2: Image Hosting (Cloudflare R2) ✅ SIMPLIFIED

- [x] Set up Cloudflare R2 bucket
- [x] Configure R2 API credentials and custom domain
- [x] Install @aws-sdk/client-s3 for S3-compatible uploads
- [x] AI image generation uploads to R2
- [x] **Decision:** Only AI-generated images hosted (no user uploads)
- [ ] Style reference validation (R2-only images)

### Week 3: Content Moderation (SIMPLIFIED)

- [ ] Implement text moderation (Stage 1)
- [ ] ~~Implement image moderation (Stage 2)~~ **REMOVED** (AI images safe by default)
- [ ] Create publish preview UI
- [ ] Add moderation attempt limits (3 max)
- [ ] Store analysis results
- [ ] Validate style references are from R2 bucket

### Week 4: Publishing Flow

- [ ] Complete publish workflow
- [ ] Test with various content types
- [ ] Add content warning badges
- [ ] Prepare for gallery (Phase 1B+)

## Success Metrics

- ✅ Publishing takes < 30 seconds (with images)
- ✅ Moderation cost < 0.50 NOK per deck
- ✅ < 5% false positive blocks
- ✅ 90%+ of RPG content allowed with appropriate tags

## What's NOT in Phase 1B

- ❌ Payment/credits (that's Phase 1C)
- ❌ AI generation server-side (Phase 1C)
- ❌ User ratings (Phase 2)
- ❌ Remixes tracking (Phase 2)
- ❌ Gallery page (Phase 1B+ / mini-phase)

## Next: Phase 1C

Once Phase 1B is complete:

- Move AI generation server-side
- Implement credit system
- Add Lemon Squeezy payments
- Watermarking for "cheap tier"
