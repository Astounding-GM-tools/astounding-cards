# Card Deck Creator

🎲 **Try it now at [cards.astounding.games](https://cards.astounding.games)** 🎲

Browser tool for creating and managing custom cards for tabletop RPGs, board games, or any creative project. Create character cards, item cards, location cards, and more!

## ✨ Features

- 🎨 **Multiple Card Types**: Characters, items, locations, and custom types
- 🖼️ **Image Support**: Add portraits and artwork (stored locally in your browser)
- 🎭 **Multiple Themes**: Classic, Cyberdeck, Cordial, and Scriptorum styles
- 🎯 **Customizable Vocabularies**: Personalize stat names for any RPG system (Health → Hit Points, Defense → Armor Class, etc.)
- 📋 **Smart Templates**: Quickly add relevant stats with contextual templates that adapt to your vocabulary
- 📱 **Fully Offline**: Works completely in your browser - no internet required after loading
- 🔗 **Easy Sharing**: Share entire decks via simple URLs
- 🖨️ **Print Ready**: Optimized layouts for home printing on standard paper
- 💾 **Auto-Save**: All your work is automatically saved to your browser
- 🚀 **No Installation**: Just visit the website and start creating!

## 🚀 Getting Started

**For Users**: Visit [cards.astounding.games](https://cards.astounding.games) and start creating! No installation, registration, or setup required.

**For Developers**: If you want to contribute to the code or run your own version:

1. Clone this repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open `http://localhost:5173`

## 🎯 How It Works

Card Deck Creator is a **client-side only** application:

- ✅ All data stored in your browser (IndexedDB)
- ✅ Images stored locally as blobs
- ✅ No servers, databases, or accounts needed
- ✅ Works offline once loaded
- ✅ Your data stays on your device
- ✅ Share decks via URL serialization

## Printing Instructions

You have two options for creating your character cards:

### Option 1: Double-Sided Paper Printing

Perfect for quick prototyping or when you need cards quickly:

1. Select the characters you want to print
2. Configure print settings:
   - Enable/disable crop marks as needed
3. Use your browser's print function (Ctrl+P / Cmd+P)
4. In the print dialog:
   - Select "Double-sided"
   - Choose "Flip on long edge"
   - Set paper size to A4
   - Disable margins/enable "Fit to page"
5. Print and cut along crop marks

**Paper Recommendations:**

- Use 160-200gsm paper for best results (card stock)
- 120gsm minimum for double-sided printing
- Most home/office printers can handle up to 200gsm
- Test a single page first if using heavier paper

**Making Cards More Durable:**

- Use clear acrylic spray sealant (available at craft stores)
- Apply 2-3 light coats, letting each dry completely
- Seals the ink and provides water resistance
- Makes cards more resistant to handling wear
- Test on a sample card first!

### Option 2: Premium Playing Card Mount

For a more durable, professional feel:

1. Print fronts and backs separately (single-sided)
   - Standard 80-100gsm paper is fine here
   - The playing cards provide the structure
2. Cut along crop marks carefully
3. Take standard playing cards (they match our dimensions exactly)
4. Use paper glue or double-sided tape to mount:
   - Front design on one side
   - Back design on the other side
   - Removable adhesive tape lets you reuse the cards
5. Press under weight while drying for best results
   - Stack books or similar flat weight
   - Leave for at least an hour
   - This prevents warping and ensures good adhesion

This second method gives you sturdy, card-stock quality character cards that feel great to handle and will last longer at the gaming table.

## 📚 Documentation

### For Users:

- **[Usage Guide](docs/USAGE.md)** - Complete user guide and feature walkthrough

### For Developers:

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and technical patterns
- **[Canon Update Pattern](docs/CANON_UPDATE_PATTERN.md)** - State management system
- **[Development Rules](docs/DEVELOPMENT_RULES.md)** - Svelte 5 runes mode standards
- **[Development Methodology](docs/DEVELOPMENT_METHODOLOGY.md)** - Project development approach

### Project Status & Planning:

- **[Development Roadmap](docs/ROADMAP.md)** - Future plans and feature roadmap
- **[Logic Extraction Roadmap](docs/LOGIC_EXTRACTION_ROADMAP.md)** - Component refactoring progress
- **[Refactoring Checklist](docs/REFACTORING_CHECKLIST.md)** - Systematic refactoring tracking

### Testing & Quality:

- **[Dev Tools Summary](docs/DEV_TOOLS_SUMMARY.md)** - E2E testing infrastructure
- **Current Test Status**: 244+ tests (231 unit + 13+ E2E) with comprehensive coverage

## 🛠️ Development

This project is built with:

- **SvelteKit** (static adapter for client-side only deployment)
- **TypeScript** for type safety
- **IndexedDB** for local browser storage
- **Canon Update Pattern** for consistent state management

### Architecture

The application uses a robust **Canon Update Pattern** for all state changes:

- Database-first atomic updates
- Granular loading states for user feedback
- No optimistic updates - UI reflects persisted state only
- Centralized update logic for consistency

All data is stored locally in the browser using IndexedDB, making the app work completely offline while maintaining the ability to share decks via URL serialization.

### Running Tests

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e
```

### Testing Payment Webhooks (Development)

The payment integration uses Lemon Squeezy webhooks to process transactions. To test webhooks locally:

1. **Install ngrok**: `brew install ngrok` (or download from [ngrok.com](https://ngrok.com))
2. **Start your dev server**: `npm run dev`
3. **Start ngrok tunnel**: `ngrok http 5173`
4. **Update configuration**:
   - Add ngrok hostname to `vite.config.ts` → `server.allowedHosts`
   - Add ngrok HTTPS URL to Lemon Squeezy webhook settings (e.g., `https://xyz.ngrok-free.app/api/tokens/webhook`)
5. **Restart dev server** to apply vite.config.ts changes
6. **Test purchases** using test card `4242 4242 4242 4242`

**Note**: Free ngrok URLs change on each restart. You'll need to update vite.config.ts and Lemon Squeezy webhook URL accordingly.

For detailed webhook testing instructions, see `docs/WEBHOOK_TESTING.md`.

### Building for Production

```bash
npm run build
```

Preview the production build with:

```bash
npm run preview
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
