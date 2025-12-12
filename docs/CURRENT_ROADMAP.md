# Current Roadmap

**Last Updated:** 2025-12-11
**Status:** Active Development

---

## ✅ Recently Completed

### Deck Presets (Ready to Deploy)
- Minimal preset (CAH-style simple cards)
- Trading preset (detailed cards with stats/traits)
- DeckSettingsPanel component with expandable accordion
- Print size UI improvements
- Preset switching fully integrated

**Date:** 2025-12-10
**Impact:** Flexible card styles for different use cases

### Edit Mode Route (Deployed)
- Full-screen editor at `/[slug]/edit/[cardId]`
- Card list sidebar with quick switching
- Keyboard navigation (← → Esc)
- Auto-save with 2-second debounce
- Cloud sync optimization (30s debounce + rate limiting + sendBeacon)
- Community image suggestions with smart refresh logic
- Performance optimized (no excessive rerenders or API calls)
- **All edit buttons now navigate to Edit Mode** (CardEditDialog removed)

**Date:** 2025-12-11
**Impact:** Professional editing experience, improved UX, reduced cloud sync costs, cleaner codebase

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

## 🚀 Current Priority: Payment System (Lemon Squeezy)

**Target:** This week
**Status:** IN PROGRESS - Implementation started
**Priority:** HIGH - Revenue generation!

### Features
- Token packages (5k-50k tokens, 1-10 packs)
- Lemon Squeezy checkout integration
- Webhook for payment confirmation
- Credits update via transaction system
- Purchase history in dashboard

### Implementation Tasks
- [x] Create `/docs/PAYMENT_SYSTEM.md` documentation
- [x] Create database migration for transactions table
- [x] Create Lemon Squeezy API client helpers
- [x] Create variant mapping file
- [ ] Create `/api/tokens/purchase` endpoint
- [ ] Create `/api/tokens/webhook` endpoint
- [ ] Create `/api/tokens/transactions` endpoint
- [ ] Update TokenStore component to call purchase endpoint
- [ ] Add transaction logging
- [ ] Set up Lemon Squeezy products and variants
- [ ] Configure webhook endpoint
- [ ] Test webhook integration
- [ ] Add purchase history UI to Dashboard

**Docs:** ✅ `/docs/PAYMENT_SYSTEM.md` (Complete)
**Estimate:** 10-12 hours (4 hours completed)
**Dependencies:** Lemon Squeezy API keys (getting now)

---

## 📋 Backlog (Prioritized)

### ✅ 1. Simplify Edit Modal/Dialog (COMPLETED)
**Why:** Current edit modal on base route is cramped
**What:** Simplify quick-edit dialog or redirect to Edit Route

**Decision:** ✅ Option B implemented - Removed CardEditDialog, all edit actions now navigate to Edit Mode route
**Date:** 2025-12-11

---

### 2. Themes System (Medium Priority)
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
**Dependencies:** None (Presets already complete)

---

### 3. Pro Printing Export (Low Priority)
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

### 4. Community Features (Future)
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
- ✅ Edit Mode Route (Done!)
- ✅ Deck Presets (Done!)
- [ ] Payment System (Lemon Squeezy) - **CURRENT FOCUS**

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
- ✅ `/docs/PAYMENT_SYSTEM.md` - Complete (2025-12-11)
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
1. **Remove CardEditDialog** - All edit actions now use Edit Mode route exclusively
2. **Like System = Token-Based** - Prevents spam, funds creators
3. **Presets Before Themes** - Core UX before visual polish
4. **Table Pro Printing** - Complex, low ROI for now
5. **SVG Export Alternative** - Simpler path to pro printing
6. **Keep beforeprint/afterprint** - Works well, don't fix

### Pending Decisions
- [ ] Payment packages & pricing
- [ ] Free tier limitations (tokens? decks? cards?)
- [ ] Premium feature set (what's paid?)
- [ ] Open source strategy (full vs partial?)

---

Last Updated: 2025-12-11
Next Review: 2025-12-18
