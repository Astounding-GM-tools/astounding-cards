# Character Cards

A tool for RPG Game Masters to create printable, double-sided character cards. Generate professional-looking character cards that can be printed, cut out, and optionally mounted on playing cards for a premium feel.

## Features

- Create double-sided character cards with:
  - Front: Portrait, name, age, role, and key traits
  - Back: Detailed bio and additional notes
- Print-optimized layout:
  - A4 paper size
  - 9 cards per page (3×3 grid)
  - Standard playing card size (63.5mm × 88.9mm)
  - Print-friendly margins and crop marks
- Flexible printing options:
  - Double-sided printing with automatic back alignment
  - Single-sided printing for mounting on playing cards
  - Optional crop marks for precise cutting

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser at `http://localhost:5173`

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

## Development

This project is built with:
- SvelteKit
- TypeScript
- Drizzle ORM

### Running Tests

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e
```

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
