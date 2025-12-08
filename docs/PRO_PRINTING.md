# Pro Printing Requirements & Challenges

**Status:** Not implemented - Future feature
**Priority:** Low - After Minimal preset, themes, and payment system
**Complexity:** High - Requires different rendering pipeline

## Use Case

Professional print services (like Ludocards) require print-ready PDFs with specific technical requirements that differ significantly from our current home-printing system.

## Ludocards Requirements

### File Format
- **Type:** Multipage PDF
- **Page sequence:** Front1, Back1, Front2, Back2, Front3, Back3...
- **Example:** 52-card deck = 104-page PDF
- **Duplicates:** If a card appears multiple times, repeat it in the PDF

### Technical Specifications
- **Dimensions:** 66mm × 90mm per page (standard card size)
- **Resolution:** 300 DPI native
- **Color profile:** FOGRA 39 (CMYK for professional printing)
- **Bleed:** Provided in template (likely 3mm)
- **Fonts:** Convert text to outlines (prevents font substitution issues)
- **No crop marks** or color reference bars
- **No template lines** in final file

### File Preparation Checklist
- [ ] Convert RGB to CMYK (FOGRA 39 profile)
- [ ] Embed/outline all fonts
- [ ] Remove template guides/lines
- [ ] Maintain exact 66×90mm dimensions
- [ ] Include bleed (extends artwork beyond trim)
- [ ] Export at 300 DPI
- [ ] Grayscale for black & white printing

---

## Current System vs Pro Printing

### Our Current System (Home Printing)
```
Format: A4 sheets with multiple cards
Layout: 9 cards/page (poker) or 4 cards/page (tarot)
Color: RGB (browser/screen color space)
Output: Browser print dialog → PDF
Features: Crop marks, registration marks, grid layout
Use case: Print at home, cut with scissors/trimmer
```

### Pro Printing Requirements
```
Format: Single card per page
Layout: 1 card/page, exact dimensions
Color: CMYK (professional print color space)
Output: Print-ready multipage PDF
Features: Bleed, no marks, font outlines
Use case: Upload to print service, receive finished cards
```

---

## Technical Challenges

### 1. Different Rendering Pipeline
**Problem:** Current system uses browser print (RGB, multi-card layout)
**Solution needed:** Separate export system for single-card, CMYK output

### 2. Color Space Conversion
**Problem:** Browsers render in RGB, printers need CMYK
**Solution needed:** Color profile conversion (RGB → FOGRA 39 CMYK)

### 3. Font Handling
**Problem:** Web fonts can't be "outlined" like design software
**Solution needed:** Either embed fonts properly or convert text to paths (SVG)

### 4. Bleed Management
**Problem:** Cards need to extend beyond trim size (usually 3mm)
**Solution needed:** Render cards at 72×96mm (with 3mm bleed), mark 66×90mm trim area

### 5. PDF Generation
**Problem:** Browser PDF export doesn't meet pro printing specs
**Solution needed:** Server-side or specialized PDF library

### 6. Multi-page Assembly
**Problem:** Must alternate fronts/backs in specific sequence
**Solution needed:** Generate pages in order: F1, B1, F2, B2, F3, B3...

---

## Potential Solutions

### Option 1: Server-side PDF Generation (Recommended)

**Technology:** Puppeteer + SvelteKit API endpoint

**How it works:**
1. User clicks "Export for Pro Printing"
2. API endpoint renders each card using Puppeteer (headless Chrome)
3. Generate PDF pages in F1-B1-F2-B2 sequence
4. Apply CMYK conversion (via color profiles)
5. Download final PDF

**Pros:**
- Reuses existing Svelte card components
- Full control over output
- High quality rendering

**Cons:**
- Requires server resources (Puppeteer is heavy)
- CMYK conversion is complex
- Slower than client-side

**Libraries needed:**
```bash
npm install puppeteer
npm install pdfkit  # For PDF assembly
npm install sharp   # For image processing/CMYK
```

---

### Option 2: SVG Export (Pragmatic Alternative)

**Technology:** Client-side SVG generation

**How it works:**
1. User clicks "Export as SVG"
2. Generate SVG file per card (front + back)
3. Download ZIP with all SVG files
4. User imports SVGs into Affinity Designer/Publisher
5. User applies CMYK profile and exports final PDF

**Pros:**
- Simple implementation (client-side only)
- Vector format (infinitely scalable)
- User has full control in design software
- No CMYK conversion needed (user applies profile)

**Cons:**
- Extra step for users
- Requires design software knowledge
- Not fully automated

**Implementation:**
```typescript
// Pseudo-code
function exportCardAsSVG(card: Card, preset: Preset) {
  const svg = renderCardToSVG(card, preset);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadFile(blob, `${card.title}-front.svg`);
}
```

---

### Option 3: Hybrid Approach

**Combine both:**
1. Offer SVG export (simple, immediate)
2. Add pro PDF generation later (premium feature?)
3. Users choose based on their needs/skills

---

### Option 4: Third-Party Service Integration

**Partner with print service:**
- Printful API
- Printify API
- Lulu API
- Custom print shop integration

**How it works:**
1. User designs deck in our app
2. Click "Order Professional Print"
3. Send card data to print service API
4. Service handles PDF generation + printing
5. Cards shipped to user

**Pros:**
- No PDF generation complexity
- End-to-end solution
- Revenue share opportunity

**Cons:**
- Dependency on third party
- Less control
- May cost more

---

## Recommended Approach

### Phase 1: Foundation (Now)
- ✅ Implement Minimal preset
- ✅ Add deck settings panel
- ✅ Perfect home printing experience

### Phase 2: Export Options (Later)
- ⏳ Add SVG export (simple, enables pro printing via design tools)
- ⏳ Document workflow: Export SVG → Import to Affinity → Apply CMYK → Export PDF

### Phase 3: Pro PDF (Future)
- ⏳ Implement server-side Puppeteer PDF generation
- ⏳ Add CMYK color profile conversion
- ⏳ Automate full pro printing workflow

### Phase 4: Print Service (Aspirational)
- ⏳ Integrate with print-on-demand service
- ⏳ One-click "Order Physical Cards"
- ⏳ Revenue share with print partner

---

## Decision: Table Pro Printing

**Rationale:**
1. **Complexity vs Value** - High effort, benefits small subset of users
2. **Workaround exists** - Users can export cards as images, import to design tools
3. **SVG export solves 80%** - Simple to implement, covers most pro printing needs
4. **Focus on core features** - Presets, themes, payment system are higher priority

**Next steps:**
- Document SVG export workflow in user guide
- Add "Pro Printing Tips" section to docs
- Consider SVG export as a future enhancement
- Revisit if user demand is high

---

## Resources

### Print Services
- [Ludocards](https://www.ludocards.com/) - Custom card printing (EU)
- [MakePlayingCards](https://www.makeplayingcards.com/) - Custom cards (US/Global)
- [PrintNinja](https://www.printninja.com/) - Professional game printing

### Technical References
- [FOGRA 39 Color Profile](https://www.color.org/registry/FOGRA39.xalter)
- [PDF/X-4 Standard](https://en.wikipedia.org/wiki/PDF/X) - Professional printing PDF standard
- [Puppeteer PDF Generation](https://pptr.dev/#?product=Puppeteer&show=api-pagepdfoptions)
- [SVG to PDF Conversion](https://github.com/yWorks/svg2pdf.js)

### Similar Projects
- [Card Creator](https://github.com/nhmkdev/cardmaker) - Card design tool with PDF export
- [Squib](https://github.com/andymeneely/squib) - Ruby DSL for card game prototyping

---

## Future Considerations

### If We Build Pro PDF Export

**Features to include:**
- [ ] Preset-specific bleed handling
- [ ] Custom card dimensions (support various print services)
- [ ] Color profile selection (FOGRA 39, SWOP, etc.)
- [ ] Preview mode (show bleed/trim lines)
- [ ] Batch export progress indicator
- [ ] Email delivery for large decks (>100 cards)

**Pricing strategy:**
- Free: Home printing (current)
- Free: SVG export
- Paid: Pro PDF generation (server costs justify charge)
- Premium: Print-on-demand integration

**Technical debt to avoid:**
- Don't mix home printing and pro printing code
- Keep separate rendering pipelines
- Use feature flags to enable/disable
- Abstract card rendering for reuse

---

Last updated: 2025-12-08
Status: Documented, not prioritized for implementation
