# User Actions - Comprehensive Mapping

**Purpose**: Map all user actions, their contexts, ownership rules, and implementation status to design a clear, intuitive action system.

---

## Action Organization Summary

### 🎯 Context Menu Actions (Header)
**Primary Actions:**
- Generate (Dropdown): Full Deck, Deck Images
- Share (Dropdown): Share URL, Export JSON, Publish/Update, Unpublish
- Add Card
- Add to Library (for non-owned decks)

**Overflow Menu:**
- Toggle Print Size (Small/Big)
- Change Image Style
- Import Cards from JSON
- Duplicate Deck
- Delete Deck

### 🏠 Dashboard Actions
- Create New Deck
- Switch Deck (deck switcher)
- Buy/Add Tokens
- Sign In/Sign Out

### 🎨 Gallery Actions (Gallery Page)
- Browse/Search Decks
- Filter by Tags
- Sort (Recent/Popular/Imported)
- Pagination (Load More)

### ✏️ In-Page Actions
- Rename Deck (inline edit)
- Flip Card (front/back)
- Print Deck (browser Cmd+P)
- Edit Cards (separate card edit UI)

---

## Deck Context Types

1. **Local Owned** - User owns the deck, stored in IndexedDB
2. **Local Owned + Published** - User owns it AND it's in the gallery
3. **Gallery (Not Owned)** - Deck in gallery, user doesn't have local copy
4. **Gallery (Imported)** - Deck in gallery, user has imported local copy
5. **Shared URL** - Deck shared via URL (may or may not be in gallery)

---

## Action Domains & Complete List

### 🎴 Deck Management (Core)

| Action | Context | Owner Required | Auth Required | Implemented | In UI | Phase | Location | Notes |
|--------|---------|----------------|---------------|-------------|-------|-------|----------|-------|
| **Create New Deck** | Dashboard | N/A | No | ✅ Yes | ✅ Yes | MVP | Dashboard | Basic deck creation |
| **Switch Deck** | Dashboard | N/A | No | ✅ Yes | ✅ Yes | MVP | Dashboard | Load different deck |
| **Rename Deck** | Local Owned | Yes | No | ✅ Yes | ✅ Yes | MVP | Inline Edit | Click title to edit |
| **Toggle Print Size** | Local Owned | Yes | No | ✅ Yes | ✅ Yes | MVP | Context Menu (Overflow) | Small (poker) / Big (tarot) |
| **Change Image Style** | Local Owned | Yes | No | ✅ Yes | ⚠️ Partial | MVP | Context Menu (Overflow)? | Currently buried in settings? |
| **Duplicate Deck** | Local Owned | Yes | No | ✅ Yes | ✅ Yes | MVP | Context Menu (Overflow) | Creates copy with new ID |
| **Delete Deck (Local)** | Local Owned | Yes | No | ✅ Yes | ✅ Yes | MVP | Context Menu (Overflow) | Removes from IndexedDB |
| **Edit Metadata Dialog** | Local Owned | Yes | No | ❌ No | ❌ No | Phase 2 | Context Menu (Overflow) | Consolidated dialog for all metadata |

**Removed:**
- ~~Edit Deck Metadata~~ → Destructured into individual actions (Print Size, Image Style) + future dialog
- ~~Card Back Visibility~~ → Not needed (flip buttons + print odd pages only)

**Not Critical for MVP:**
- Theme selection (no themes yet)
- Deck Domains (Educational, RPG, etc.)
- Keywords/Tags (can add in Phase 2)

### 📤 Deck Sharing (Distribution)

| Action | Context | Owner Required | Auth Required | Implemented | In UI | Phase | Location | Notes |
|--------|---------|----------------|---------------|-------------|-------|-------|----------|-------|
| **Create Share URL** | Local Owned | Yes | No | ✅ Yes | ✅ Yes | MVP | Context Menu (Share) | URL-encoded deck data |
| **Export JSON** | Local Owned | Yes | No | ✅ Yes | ✅ Yes | MVP | Context Menu (Share) | Deck data without images |
| **Publish to Gallery** | Local Owned (not published) | Yes | **Yes** | ✅ Yes | ✅ Yes | MVP | Context Menu (Share) | Upload to Supabase |
| **Update Published Version** | Local Owned + Published | Yes | **Yes** | ✅ Yes | ⚠️ Confusing | MVP | Context Menu (Share) | Shows as "Publish" even if already published |
| **Unpublish from Gallery** | Local Owned + Published | Yes | **Yes** | ✅ Yes | ❌ Missing | MVP | Context Menu (Share)? | Not exposed in UI yet |
| **Copy Gallery Link** | Gallery (Any) | No | No | ❌ No | ❌ No | Phase 2 | Context Menu | Copy gallery URL to clipboard |
| **Export JSON (with images)** | Local Owned | Yes | No | ❌ No | ❌ No | Phase 2 | Context Menu (Share) | Include images as base64 |

**UI Issues to Fix:**
- "Publish" button doesn't change to "Update Published" when already published
- "Unpublish" action not exposed anywhere in UI
- Need conditional logic: `isPublished ? "Update Published" : "Publish to Gallery"`

### 📥 Deck Discovery (Acquisition)

| Action | Context | Owner Required | Auth Required | Implemented | In UI | Phase | Location | Notes |
|--------|---------|----------------|---------------|-------------|-------|-------|----------|-------|
| **Browse Gallery** | Gallery | No | No | ✅ Yes | ✅ Yes | MVP | Gallery Page | Search, filter, sort |
| **Add to Library (from Gallery)** | Gallery (Not Owned) | No | No | ✅ Yes | ⚠️ Confusing | MVP | Context Menu | Currently says "Import" with heart icon |
| **Add to Library (from Share URL)** | Shared URL | No | No | ✅ Yes | ✅ Yes | MVP | Automatic | Uses MergeTool on URL load |
| **Import Cards from JSON** | Local Owned | Yes | No | ✅ Yes | ✅ Yes | MVP | Dashboard/Overflow | Add cards to existing deck |
| **Update from Gallery** | Local Owned (from Gallery) | Yes | No | ❌ No | ❌ No | Phase 2 | Context Menu | Pull latest version if changed |

**UI Issues to Fix:**
- "Add to Library" currently labeled as "Import" with heart icon (confusing!)
- Should say "Add to Library" or "Add to My Decks"
- Heart should only be for "Like" (Phase 2)

### ❤️ Social/Engagement

| Action | Context | Owner Required | Auth Required | Implemented | In UI | Phase | Location | Notes |
|--------|---------|----------------|---------------|-------------|-------|-------|----------|-------|
| **Like Deck** | Gallery (Any) | No | **Yes** | ❌ No | ❌ No | Phase 2 | Context Menu | Lightweight social signal |
| **Add to Library** | Gallery (Not Owned) | No | No | ✅ Yes | ⚠️ Partial | MVP | Context Menu | Better term than "Import" |
| **View Like Count** | Gallery (Any) | No | No | ✅ Yes | ✅ Yes | MVP | Deck Card | Shows like count |
| **View Import Count** | Gallery (Any) | No | No | ✅ Yes | ✅ Yes | MVP | Deck Card | Shows how many added it |
| **Report Deck** | Gallery (Any) | No | **Yes** | ❌ No | ❌ No | Phase 2 | Context Menu | Moderation/abuse |

**Removed/Consolidated:**
- ~~Favorite/Bookmark~~ → Same as "Add to Library"
- ~~Import = Like (MVP)~~ → Separated into distinct actions
- ~~Comment on Deck~~ → Moved to "Future Ideas" section
- ~~Rate Deck~~ → Moved to "Future Ideas" section (Like is sufficient)

### 🤖 AI Generation

| Action | Context | Owner Required | Auth Required | Implemented | In UI | Phase | Location | Notes |
|--------|---------|----------------|---------------|-------------|-------|-------|----------|-------|
| **Generate Full Deck** | Dashboard | N/A | **Yes** | ✅ Yes | ✅ Yes | MVP | Context Menu (Generate) | Creates new deck with AI |
| **Generate Deck Images** | Local Owned | Yes | **Yes** | ✅ Yes | ✅ Yes | MVP | Context Menu (Generate) | AI images for all cards |
| **Generate Single Card** | Local Owned | Yes | **Yes** | ✅ Yes | ✅ Yes | MVP | Card Edit UI | AI for one card (not in Context Menu) |

**Note:** All AI actions require authentication + token balance

### 👤 User/Account Management

| Action | Context | Owner Required | Auth Required | Implemented | In UI | Phase | Location | Notes |
|--------|---------|----------------|---------------|-------------|-------|-------|----------|-------|
| **Sign Up / Sign In** | Any | N/A | No | ✅ Yes | ✅ Yes | MVP | Header | Supabase auth |
| **Sign Out** | Any | N/A | **Yes** | ✅ Yes | ✅ Yes | MVP | Header | Clear session |
| **Buy/Add Tokens** | Dashboard | N/A | **Yes** | ✅ Yes | ✅ Yes | MVP | Dashboard | AI generation credits |
| **View Token Balance** | Dashboard | N/A | **Yes** | ✅ Yes | ✅ Yes | MVP | Header | Show remaining tokens |
| **View My Decks (Local)** | Dashboard | N/A | No | ✅ Yes | ✅ Yes | MVP | Dashboard | Deck switcher (all local decks) |
| **View My Published Decks** | Dashboard | N/A | **Yes** | ❌ No | ❌ No | Phase 2 | Dashboard Tab | Filter for published only |
| **Edit Profile** | Dashboard | N/A | **Yes** | ❌ No | ❌ No | Phase 2 | Dashboard Settings | Name, email, avatar |
| **Delete Account** | Dashboard | N/A | **Yes** | ❌ No | ❌ No | Phase 3 | Dashboard Settings | GDPR compliance |

**Note:** "My Decks" = all local decks (whether published or not). Dashboard shows them all.

### 🎨 Deck Layout/Display

| Action | Context | Owner Required | Auth Required | Implemented | In UI | Phase | Location | Notes |
|--------|---------|----------------|---------------|-------------|-------|-------|----------|-------|
| **Toggle Print Size** | Any | No | No | ✅ Yes | ✅ Yes | MVP | Context Menu (Overflow) | Small (poker) / Big (tarot) - works for any deck |
| **Flip Card (Front/Back)** | Any | No | No | ✅ Yes | ✅ Yes | MVP | Card UI | Replaces "Card Back Visibility" |
| **Print Deck** | Any | No | No | ✅ Yes | ✅ Yes | MVP | Browser (Cmd+P) | Browser print dialog |

**Removed:**
- ~~Switch Theme~~ → No themes yet (placeholder for future)
- ~~Card Back Visibility~~ → Replaced by flip buttons + print odd pages only
- ~~Toggle Card Layout~~ → Same as "Toggle Print Size" - remove duplicate UI if exists

### 🔧 Admin/Moderation

| Action | Context | Owner Required | Auth Required | Implemented | In UI | Phase | Location | Notes |
|--------|---------|----------------|---------------|-------------|-------|-------|----------|-------|
| **Hide/Remove Deck** | Gallery (Any) | No | **Admin** | ❌ No | ❌ No | Phase 2 | Admin Panel | Moderation (remove from gallery) |
| **Promote Deck** | Gallery (Any) | No | **Admin** | ❌ No | ❌ No | Phase 3 | Admin Panel | Feature on homepage |
| **Ban User** | Admin Panel | No | **Admin** | ❌ No | ❌ No | Phase 3 | Admin Panel | User management |
| **View Analytics** | Admin Panel | No | **Admin** | ❌ No | ❌ No | Phase 3 | Admin Panel | Usage stats |

**Note:** Admin features not needed for MVP launch

---

## 💡 Future Ideas (Phase 3+)

These are good ideas but not planned for near-term implementation:

- **Comment on Deck** - Full commenting/discussion system
- **Rate Deck (1-5 stars)** - Detailed ratings (Like is sufficient for now)
- **Deck Collections** - Group decks into themed collections
- **Follow Users** - Social following/feed
- **Deck Versioning** - Track changes over time with changelog
- **Advanced Search** - Complex filters, full-text search
- **Deck Templates** - Pre-built starter templates
- **Collaborative Editing** - Multi-user deck editing
- **Deck Forking** - Create derivative works with attribution

---

## Current Issues to Resolve

### 1. **Like vs Import Conflation** 🔴 HIGH PRIORITY
**Problem**: "Import" and "Like" are the same action right now
- Import creates local copy AND increments `import_count`
- No way to "like" without importing
- Heart icon is confusing (filled = imported, not liked)

**Solution**:
- Phase 1 (MVP): Keep as-is, rename UI to be clearer
- Phase 2: Separate actions:
  - `likes` table: user_id, deck_id, timestamp
  - `import_count` stays as-is
  - Heart = Like (lightweight, just track preference)
  - Import = Create local copy (also increments import count)

### 2. **Published Deck Sync** 🟡 MEDIUM PRIORITY
**Problem**: No way to sync changes from gallery back to local copy
- User imports deck, gallery owner updates it
- No notification or way to pull updates

**Solution**:
- Phase 2: Add "Update from Gallery" button when:
  - Local deck has `sourceGalleryId` metadata
  - Gallery version has newer `lastEdited` timestamp
  - Shows diff and uses MergeTool for conflicts

### 3. **Context-Sensitive Actions Visibility** 🔴 HIGH PRIORITY
**Problem**: Actions shown don't always make sense for context
- "Publish" shown even if already published (should say "Update")
- "Import" shown even if already imported (should be disabled/hidden)
- Delete button appears in wrong contexts

**Solution**: Need clear visibility rules (see next section)

### 4. **Deck Ownership Tracking** 🟡 MEDIUM PRIORITY
**Problem**: Hard to know if gallery deck is "mine"
- No `owner_id` check in gallery
- Can't easily filter "My Published Decks"

**Solution**:
- Phase 1: Add owner check in gallery API
- Phase 2: Add "My Decks" tab in dashboard

---

## Action Visibility Rules (by Page)

### **Dashboard (src/routes/+page.svelte)**
**Context**: Local Owned deck loaded

| Action | Show When | Primary/Overflow | Notes |
|--------|-----------|------------------|-------|
| Generate (Full Deck) | Always | Primary | Creates NEW deck |
| Generate (Images) | isAuthenticated | Primary Dropdown | For current deck |
| Add Card | Always | Primary | Core action |
| Share → Share URL | Always | Primary Dropdown | URL encode |
| Share → Export JSON | Always | Primary Dropdown | Minimal export |
| Share → Publish | isAuthenticated && !isPublished | Primary Dropdown | First publish |
| Share → Update Published | isAuthenticated && isPublished | Primary Dropdown | Re-sync |
| Print Size Toggle | Always | Overflow | Small/Big |
| Import Cards | Always | Overflow | JSON import |
| Duplicate Deck | Always | Overflow | Copy deck |
| Delete Deck | Always | Overflow | Remove local |

### **Gallery (src/routes/gallery/+page.svelte)**
**Context**: Browsing published decks

| Action | Show When | Location | Notes |
|--------|-----------|----------|-------|
| Search | Always | Header | Filter decks |
| Sort (Recent/Popular/Imported) | Always | Header | Order by |
| Filter by Tags | Always | Below header | Tag chips |
| Import Deck | Click on deck card | Deck card action | Creates local copy |
| View Deck Details | Click on deck | Navigate | Go to [slug] page |

### **Deck View [slug] (src/routes/[slug]/+page.svelte)**
**Context**: Viewing specific deck (local OR gallery OR shared URL)

| Action | Show When | Primary/Overflow | Notes |
|--------|-----------|------------------|-------|
| Add Card | isOwned | Primary | Edit mode |
| Import/Like | !isOwned && !hasLocalCopy | Primary | Heart button |
| Share → Share URL | Always | Primary Dropdown | Anyone can share |
| Share → Export JSON | Always | Primary Dropdown | Anyone can export |
| Share → Publish | isOwned && isAuthenticated && !isPublished | Primary Dropdown | Owner only |
| Share → Update Published | isOwned && isAuthenticated && isPublished | Primary Dropdown | Owner only |
| Share → Unpublish | isOwned && isAuthenticated && isPublished | Primary Dropdown | Owner only |
| Print Size Toggle | Always | Overflow | Anyone can adjust for print |
| Import Cards | isOwned | Overflow | Owner only |
| Duplicate Deck | isOwned | Overflow | Owner only |
| Delete Deck | isOwned | Overflow | Owner only |

---

## MVP (Phase 1) Requirements ✅

**What we MUST have before launch:**

1. ✅ Create/Edit/Delete local decks
2. ✅ Publish to gallery (auth required)
3. ✅ Update published deck
4. ✅ Unpublish from gallery
5. ✅ Browse gallery (search, filter, sort)
6. ✅ Import from gallery (conflated with like)
7. ✅ Share URL (URL-encoded)
8. ✅ Export JSON (minimal)
9. ✅ AI generation (auth + tokens)
10. ✅ Token purchase/management
11. ⚠️ **MISSING**: Clear action visibility logic (see issue #3)
12. ⚠️ **MISSING**: Better labeling for Import/Like

**Action Items for MVP Launch:**
- [ ] Implement visibility rules table above
- [ ] Rename "Import" to "Import & Like" or similar
- [ ] Add `isPublished` check to show "Update Published" vs "Publish"
- [ ] Hide Import button if user already has local copy
- [ ] Test all actions in all contexts

---

## Phase 2 Features 🔮

- Separate Like from Import (dedicated likes table)
- "Update from Gallery" for imported decks
- "My Published Decks" dashboard tab
- Full JSON export (with images)
- Edit user profile
- Report deck (moderation)
- Copy gallery link to clipboard

---

## Phase 3+ Features 🚀

- User profiles with collections
- Comments and ratings
- Favorites/bookmarks
- Admin panel (promote, hide, ban)
- Analytics dashboard
- Deck versioning/changelog
- Advanced search filters

---

## Notes & Decisions

1. **Import = Like** for MVP is acceptable, but needs clearer UI
2. **Auth is required** for: AI generation, publishing, liking (Phase 2)
3. **Auth is NOT required** for: viewing gallery, importing, share URLs
4. **Ownership** is local-only for MVP (no server-side ownership tracking yet)
5. **Delete** should prompt for unpublish if deck is published
6. **MergeTool** handles conflicts for imports and share URLs
7. **Print layout** works for any deck (owned or not)

---

## 📊 MVP Readiness Summary

### ✅ Fully Implemented & In UI (Ready for Launch)
- Create/Switch/Rename/Duplicate/Delete Deck
- Add Card (for owned decks)
- Generate Full Deck / Deck Images (with auth + tokens)
- Share URL / Export JSON
- Browse Gallery (search, filter, sort, pagination)
- Print Size Toggle / Flip Cards / Print Deck
- Sign In/Out / Token Management

### ⚠️ Implemented but UI Issues (Needs Fix)
1. **"Import" → Rename to "Add to Library"**
   - Currently says "Import" with heart icon (confusing!)
   - Should clearly say "Add to Library" or "Add to My Decks"

2. **"Publish" → Context-aware label**
   - Always shows "Publish to Gallery" even if already published
   - Should check `isPublished` and show "Update Published" when appropriate

3. **"Unpublish" → Missing from UI**
   - Backend implemented, not exposed in UI
   - Should be in Share dropdown when `isPublished === true`

4. **"Change Image Style" → Location unclear**
   - Implemented but buried somewhere?
   - Should be in Overflow menu

### ❌ Missing for MVP (Need to Implement)
- **Context-sensitive action visibility** (see "Action Visibility Rules" below)
- Clear distinction between owned vs non-owned deck actions

### 🎯 Action Visibility Rules (To Implement)

#### Dashboard Page (Local Owned Deck)
```typescript
Show:
- Generate (if authenticated)
- Add Card
- Share → Share URL, Export JSON, Publish (if !isPublished), Update Published (if isPublished)
- Overflow → Print Size, Image Style, Import Cards, Duplicate, Delete
```

#### Gallery Page (Browsing)
```typescript
Show:
- Search/Filter/Sort controls
- Click deck → Navigate to [slug] page
```

#### [slug] Page - Owned Deck
```typescript
Show:
- Generate (if authenticated)
- Add Card
- Share → Share URL, Export JSON, Publish/Update, Unpublish (if isPublished)
- Overflow → Print Size, Image Style, Import Cards, Duplicate, Delete
```

#### [slug] Page - Non-Owned Deck (Gallery or Share URL)
```typescript
Show:
- Add to Library (if !hasLocalCopy)
- Add to Library [DISABLED/HIDDEN] (if hasLocalCopy) // Already have it
- Share → Share URL, Export JSON (anyone can share/export)
- Overflow → Print Size only (no edit actions)
```

---

## 🚀 Pre-Launch Checklist

**Critical for MVP:**
- [ ] Rename "Import" button to "Add to Library"
- [ ] Implement `isPublished` check for "Publish" vs "Update Published"
- [ ] Add "Unpublish" option to Share dropdown (when `isPublished`)
- [ ] Hide "Add to Library" if user already has local copy (`hasLocalCopy`)
- [ ] Implement context-sensitive visibility (owned vs non-owned)
- [ ] Move/clarify "Change Image Style" location (overflow menu)
- [ ] Remove duplicate "Toggle Card Layout" UI if exists (same as Print Size)
- [ ] Test all actions in all contexts (owned, gallery, shared URL)

**Nice to Have (Can defer):**
- [ ] Separate Like from Add to Library (Phase 2)
- [ ] "Update from Gallery" for imported decks (Phase 2)
- [ ] "My Published Decks" dashboard filter (Phase 2)

---

*Last updated: 2025-11-20*
*Status: Ready for UI refactoring based on action visibility rules*
