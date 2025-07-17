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
- Double-sided printing support:
  - Automatic back side alignment
  - Designed for long-edge flip printing
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

1. Select the characters you want to print
2. Configure print settings:
   - Enable/disable crop marks as needed
3. Use your browser's print function (Ctrl+P / Cmd+P)
4. In the print dialog:
   - Select "Double-sided"
   - Choose "Flip on long edge"
   - Set paper size to A4
   - Disable margins/enable "Fit to page"
5. Print, cut along crop marks, and optionally mount on playing cards

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
