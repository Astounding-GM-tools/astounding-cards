# Current Roadmap

**Last Updated:** 2025-12-08
**Status:** Active Development

---

## ✅ Recently Completed

### Deck Likes Feature (Deployed)
- Token-based like system (10 tokens)
- 50/50 split for remixed decks
- Prevents self-likes
- HTTP caching for featured/gallery
- Proper REST status codes (403, 409, 402)
- Auth headers using established helpers

**Date:** 2025-12-08
**Impact:** Creator economy launched, homepage performance improved

---

## 🚀 Current Priority: Deck Presets

**Target:** Next deployment
**Status:** Planning complete, ready to implement

### Features
1. **Minimal Preset** - CAH-style simple cards (title, subtitle, image only)
2. **Trading Preset** - Current detailed cards (default)
3. **Deck Settings Panel** - Expandable accordion on deck page
4. **Print Size UI** - Rename "Layout" to "Small/Large" with visual previews

### Implementation Tasks
- [ ] Add `preset` field to DeckMeta type
- [ ] Create CardPresetMinimal.svelte
- [ ] Refactor CardPresetTrading.svelte
- [ ] Update CardPreview switcher
- [ ] Build DeckSettingsPanel component
- [ ] Wire up settings to deck page
- [ ] Test preset switching with Canon Update
- [ ] Update print layout to respect presets

**Docs:** `/docs/DECK_PRESETS.md`
**Estimate:** 6-8 hours
**Dependencies:** None

---

## 📋 Backlog (Prioritized)

### 1. Edit Mode Route (Medium Priority)
**Why:** Current edit modal is cramped
**What:** Full-screen editor at `/[slug]/edit/[cardId]`

**Features:**
- Spacious full-page editor
- Card list sidebar (quick switching)
- View Transitions API (smooth animations)
- Keyboard navigation (← → Esc)
- Future: Quick Edit dialog for single fields

**Docs:** `/docs/EDIT_MODE.md`
**Estimate:** 8-10 hours
**Blocks:** None

---

### 2. Payment System (Lemon Squeezy) (High Priority - Revenue!)
**Why:** Approved by Lemon Squeezy, ready to monetize
**What:** Token purchase flow + payment webhook

**Features:**
- Token packages (100, 500, 1000 tokens)
- Lemon Squeezy checkout integration
- Webhook for payment confirmation
- Credits update via transaction system
- Purchase history in dashboard

**Implementation:**
- `/api/tokens/purchase` - Create checkout session
- `/api/tokens/webhook` - Handle Lemon Squeezy webhook
- TokenStoreDialog - Update with real pricing
- Transaction logging (already in DB)

**Docs:** TODO - Need to create `/docs/PAYMENT_SYSTEM.md`
**Estimate:** 10-12 hours
**Dependencies:** Lemon Squeezy API keys

---

### 3. Themes System (Medium Priority)
**Why:** Visual variety, monetization opportunity
**What:** Multiple themes per preset

**Trading Preset Themes:**
- Classic (current)
- Medieval Manuscript
- Cyberpunk Neon
- Fantasy Scroll
- Sci-Fi Data Card

**Minimal Preset Themes:**
- Clean (current)
- Elegant Serif
- Bold Sans
- Handwritten

**Implementation:**
- Theme CSS files per preset
- Theme selector in settings
- Preview before applying
- Premium themes (paid feature?)

**Docs:** TODO
**Estimate:** 12-15 hours
**Dependencies:** Deck Presets complete

---

### 4. Pro Printing Export (Low Priority)
**Why:** Print services like Ludocards need specific format
**What:** Export print-ready PDFs or SVGs

**Options:**
- SVG export (pragmatic, simple)
- Server-side PDF generation (Puppeteer)
- Print service integration

**Docs:** `/docs/PRO_PRINTING.md`
**Estimate:** 20-30 hours (complex!)
**Dependencies:** None (standalone feature)
**Decision:** Table for now, SVG export later

---

### 5. Community Features (Future)
**Why:** User engagement and growth
**What:** Social features around decks

**Features:**
- Comments on published decks
- Remix notifications (notify original creator)
- User profiles (show published decks)
- Follow favorite creators
- Deck collections/playlists

**Estimate:** 40+ hours (major feature)
**Dependencies:** Auth system (done), user profiles (new)

---

## 🎯 Q1 2025 Goals

### By End of January
- ✅ Deck Likes (Done!)
- [ ] Deck Presets (In progress)
- [ ] Edit Mode Route
- [ ] Payment System (Lemon Squeezy)

### By End of February
- [ ] Themes System
- [ ] User Profiles
- [ ] Analytics Dashboard (for creators)

### By End of March
- [ ] Mobile App (PWA improvements)
- [ ] Community Features (basic)
- [ ] Premium Themes Launch

---

## 🔧 Technical Debt

### High Priority
- [ ] Flatten `src/lib/next/` to `src/lib/` (codebase cleanup)
- [ ] Remove legacy stores (`src/lib/stores/canonUpdate.ts`)
- [ ] Consolidate type definitions (Card types are duplicated)

### Medium Priority
- [ ] Add E2E tests for like feature
- [ ] Improve error handling in AI endpoints
- [ ] Add loading states to all async actions

### Low Priority
- [ ] Optimize bundle size (theme CSS splitting)
- [ ] Add service worker (offline support)
- [ ] Migrate to Vitest 2.0

---

## 📊 Metrics to Track

### User Engagement
- Decks created per week
- Average cards per deck
- Publish rate (% of decks published)
- Like activity (likes given/received)

### Revenue (Post-Payment)
- Token purchases per week
- Average purchase size
- Conversion rate (free → paid)
- Token usage patterns

### Technical
- Page load times (aim for <2s)
- API response times (aim for <200ms)
- Error rates (<1%)
- Cache hit rates (aim for >80%)

---

## 🚫 Not On Roadmap (Yet)

### Features We're NOT Building Now
1. **Mobile Native Apps** - PWA is sufficient
2. **Real-time Collaboration** - Too complex, low demand
3. **Deck Versioning** - Canon Update is enough
4. **Custom Fonts Upload** - Security/performance concerns
5. **Video Backgrounds** - Performance impact

### Why Not?
- Limited resources (solo dev + AI)
- Focus on core value (deck creation)
- Avoid feature bloat
- Can always revisit if demand is high

---

## 📝 Documentation Status

### Complete & Current
- ✅ `/docs/CANON_UPDATE_PATTERN.md`
- ✅ `/docs/DEVELOPMENT_RULES.md` (Svelte 5 runes)
- ✅ `/docs/DEVELOPMENT_METHODOLOGY.md` (Testing strategy)
- ✅ `/docs/DECK_PRESETS.md` (NEW - Complete)
- ✅ `/docs/EDIT_MODE.md` (NEW - Complete)
- ✅ `/docs/PRO_PRINTING.md` (NEW - Complete)

### Needs Review/Update
- ⚠️ `/docs/ARCHITECTURE.md` - Update with new features
- ⚠️ `/docs/ROADMAP.md` - Superseded by this file?
- ⚠️ `/docs/USAGE.md` - Add likes, presets

### Missing/TODO
- ❌ `/docs/PAYMENT_SYSTEM.md` - Need to create
- ❌ `/docs/THEMES.md` - Future
- ❌ `/docs/API.md` - Document all endpoints

---

## 🎨 Design System Debt

### Component Library Gaps
- [ ] Standardize button variants (too many custom styles)
- [ ] Create RadioGroup component (reuse in settings)
- [ ] Build Accordion component (for settings panel)
- [ ] Toast notification improvements (queue, dismiss all)

### Design Tokens
- [ ] Define CSS custom properties for spacing
- [ ] Color palette documentation
- [ ] Typography scale standardization

---

## 🔐 Security & Privacy

### Current Status
- ✅ Supabase RLS policies (row-level security)
- ✅ Auth tokens via Authorization header
- ✅ CSRF protection (SvelteKit default)
- ✅ Input validation on API routes

### TODO
- [ ] Rate limiting on API endpoints
- [ ] Image upload size limits
- [ ] Content moderation for published decks
- [ ] GDPR compliance (data export/deletion)

---

## 📞 Support & Feedback

### Channels
- GitHub Issues: Bug reports & feature requests
- Email: Support queries
- Twitter/X: Announcements

### Common Requests (Triage)
1. **"Add more card fields"** → Custom stat definitions (roadmap)
2. **"Export to Tabletop Simulator"** → API export feature (future)
3. **"Deck templates/examples"** → Curated gallery (in progress)
4. **"Bulk import from CSV"** → Import feature (future)

---

## 🎯 Success Criteria

### By End of Q1 2025
- [ ] 1,000+ registered users
- [ ] 500+ published decks
- [ ] $500+ MRR (monthly recurring revenue)
- [ ] <2s average page load
- [ ] >90% user satisfaction (surveys)

### By End of 2025
- [ ] 10,000+ users
- [ ] 5,000+ published decks
- [ ] $5,000+ MRR
- [ ] Profitable (revenue > costs)
- [ ] Community contributors (open source?)

---

## 📅 Review Schedule

- **Weekly:** Check current priority progress
- **Monthly:** Review backlog priorities
- **Quarterly:** Assess goals vs actual progress
- **Annually:** Long-term strategy planning

---

## 🤝 Decision Log

### Recent Decisions
1. **Like System = Token-Based** - Prevents spam, funds creators
2. **Presets Before Themes** - Core UX before visual polish
3. **Table Pro Printing** - Complex, low ROI for now
4. **SVG Export Alternative** - Simpler path to pro printing
5. **Keep beforeprint/afterprint** - Works well, don't fix

### Pending Decisions
- [ ] Payment packages & pricing
- [ ] Free tier limitations (tokens? decks? cards?)
- [ ] Premium feature set (what's paid?)
- [ ] Open source strategy (full vs partial?)

---

Last Updated: 2025-12-08
Next Review: 2025-12-15
