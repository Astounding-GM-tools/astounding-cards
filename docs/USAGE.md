# Developer Usage

This document is for developers working on Card Deck Creator. For product overview and user features, see README and the UI.

## Quickstart

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in values (see Environment)
3. Start dev server: `npm run dev`
4. Run tests: `npm run test` (see Testing)

## Environment

Create `.env.local` with the following (adjust to your project):

```env
# Supabase (required for publishing, gallery, likes, tokens)
PUBLIC_SUPABASE_URL= https://<your-project>.supabase.co
PUBLIC_SUPABASE_ANON_KEY= <anon-key>
SUPABASE_SERVICE_ROLE_KEY= <service-role-key>

# Payments (Lemon Squeezy)
LEMON_SQUEEZY_WEBHOOK_SECRET= <webhook-secret>
LEMON_SQUEEZY_STORE_ID= <store-id>

# Optional image hosting
PUBLIC_R2_PUBLIC_URL= https://cdn.example.com
R2_ACCOUNT_ID= <id>
R2_ACCESS_KEY_ID= <key>
R2_SECRET_ACCESS_KEY= <secret>
R2_BUCKET= astounding-cards
```

Notes
- Frontend never uses the service role key; it’s only read inside serverless routes.
- For webhook testing, see `docs/WEBHOOK_TESTING.md`.

## Commands

- Dev: `npm run dev`
- Build: `npm run build` and `npm run preview`
- Typecheck/Lint/Format: `npm run check`, `npm run lint`, `npm run format`
- Tests: `npm run test`, `npm run test:e2e`

## Architecture (essentials)

- Client-first app with IndexedDB and URL serialization
- Minimal backend for publishing/gallery/likes/tokens/payments
- Svelte 5 (runes); see `docs/DEVELOPMENT_RULES.md`
- Canon Update Pattern; see `docs/CANON_UPDATE_PATTERN.md`

## API Surface (serverless)

- Tokens/Payments: `/api/tokens/*` (purchase, webhook, transactions)
- Gallery/Publishing: `/api/decks/*`, `/api/deck/[id]`
- Auth handled via Supabase; routes expect Authorization/cookies as applicable

Check route files under `src/routes/api/` for exact payloads. If a route isn’t present, it’s not enabled in this build.

## Testing

- Unit tests (Vitest): fast logic tests for `.svelte.ts` files
  - Run: `npm run test` or `npm run test:unit`
- E2E tests (Playwright): user workflows
  - Run: `npm run test:e2e`
- See: `docs/TESTING_GUIDE.md` and `docs/E2E_TEST_PATTERNS.md`

## Webhooks (local)

- Start dev server
- Start ngrok: `ngrok http 5173`
- Update `vite.config.ts` allowedHosts and Lemon Squeezy webhook URL to your ngrok HTTPS URL
- Follow `docs/WEBHOOK_TESTING.md` for test cards and endpoints

## Build & Deploy

- Frontend is static (SvelteKit adapter-static)
- Serverless API routes handle publishing, tokens, and webhooks
- Configure environment variables in your hosting provider (Supabase + Lemon Squeezy)

## Useful References

- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/DEVELOPMENT_METHODOLOGY.md`
- `docs/DEVELOPMENT_RULES.md`
- `docs/CANON_UPDATE_PATTERN.md`
