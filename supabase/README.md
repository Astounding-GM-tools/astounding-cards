# Supabase Setup

## Initial Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in (GitHub auth recommended)
4. Click "New project"
5. Fill in:
   - **Name:** `astounding-cards` (or your preference)
   - **Database Password:** (generate strong password, save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is fine for development
6. Click "Create new project"
7. Wait ~2 minutes for project to provision

### 2. Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or Cmd+Enter)
6. Verify all tables, indexes, and policies were created successfully

### 3. Get API Keys

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public** key
   - **service_role** key (⚠️ Keep this secret!)

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Supabase values:
   ```env
   PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

3. Never commit `.env.local` to git (already in `.gitignore`)

### 5. Verify Connection

Start your dev server:
```bash
npm run dev
```

The app should start without errors. If you see Supabase connection errors, double-check your environment variables.

## Database Schema Overview

### Tables

**users**
- Extends Supabase `auth.users`
- Tracks credits and daily free deck usage

**published_decks**
- Stores both curated (admin) and user-published decks
- Includes slug for clean URLs
- JSONB storage for card data

**generated_images**
- Tracks AI-generated images
- Links to published decks
- Stores URLs and metadata

**transactions**
- Audit trail for credits
- Tracks purchases and usage

### Row Level Security (RLS)

RLS is enabled on all tables:
- Users can only read/update their own data
- Public decks are readable by anyone
- Admins use service role key to bypass RLS

## Administration

### Creating Curated Decks

For now, use SQL Editor:

```sql
INSERT INTO published_decks (
  user_id,
  slug,
  title,
  description,
  theme,
  cards,
  is_curated,
  is_featured
) VALUES (
  NULL, -- NULL for admin-curated decks
  'fantasy-mocktails',
  'Fantasy Mocktails',
  'Magical drink recipes inspired by fantasy worlds',
  'Cocktails',
  '[...]'::jsonb, -- your card data
  true, -- is_curated
  true  -- is_featured
);
```

(We'll build a proper admin UI in Phase 1B)

### Resetting Daily Free Decks

Automatic reset via cron job (setup in Phase 1C):

```sql
SELECT reset_daily_free_decks();
```

### Viewing Stats

```sql
-- Total published decks
SELECT COUNT(*) FROM published_decks WHERE visibility = 'public';

-- Most viewed decks
SELECT title, view_count FROM published_decks 
ORDER BY view_count DESC LIMIT 10;

-- User credit balances
SELECT email, credits FROM users 
ORDER BY credits DESC LIMIT 10;
```

## Migrations

Future schema changes should be:
1. Added to a new file: `supabase/migrations/YYYYMMDD_description.sql`
2. Run in SQL Editor
3. Documented here

## Backup

Supabase automatically backs up your database. To manually export:

1. Go to **Database** → **Backups**
2. Click "Download backup"

## Production Deployment

When deploying to Vercel:

1. Add environment variables in Vercel dashboard:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Supabase automatically handles CORS for your domain

3. Monitor usage in Supabase Dashboard

## Troubleshooting

**"Missing Supabase environment variables"**
- Check `.env.local` exists and has correct values
- Restart dev server after changing env vars

**RLS Policy Errors**
- Make sure you're using the service role key for admin operations
- Check policies in **Authentication** → **Policies**

**Connection timeout**
- Verify Project URL is correct
- Check if Supabase project is paused (free tier auto-pauses after inactivity)

## Next Steps

Once Supabase is set up:
- [ ] Create first API route: `GET /api/deck/[id]`
- [ ] Test fetching a published deck
- [ ] Implement three-layer merge system
