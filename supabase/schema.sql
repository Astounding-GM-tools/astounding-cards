-- Supabase Database Schema for Astounding Cards
-- Phase 1: Public Gallery, Curated Decks & Monetization

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
-- New users get 500 credits welcome bonus (configurable in src/lib/config/token-costs.ts)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 500 CHECK (credits >= 0),
  daily_free_decks_used INTEGER DEFAULT 0 CHECK (daily_free_decks_used >= 0),
  daily_free_decks_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Published decks (includes both curated and user-published)
CREATE TABLE IF NOT EXISTS published_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for admin-curated decks
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  cards JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_curated BOOLEAN DEFAULT false, -- true for admin-created, false for user-published
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted')),
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1 CHECK (version >= 1)
);

-- Indexes for published_decks
CREATE INDEX IF NOT EXISTS idx_published_decks_theme ON published_decks(theme);
CREATE INDEX IF NOT EXISTS idx_published_decks_featured ON published_decks(is_featured);
CREATE INDEX IF NOT EXISTS idx_published_decks_slug ON published_decks(slug);
CREATE INDEX IF NOT EXISTS idx_published_decks_user_id ON published_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_published_decks_visibility ON published_decks(visibility);
CREATE INDEX IF NOT EXISTS idx_published_decks_created_at ON published_decks(created_at DESC);

-- Generated images (tracks AI-generated images)
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID REFERENCES published_decks(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  url TEXT NOT NULL,
  prompt_hash TEXT, -- for deduplication of identical prompts
  gemini_model TEXT,
  tier TEXT CHECK (tier IN ('public', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for generated_images
CREATE INDEX IF NOT EXISTS idx_generated_images_deck_id ON generated_images(deck_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_prompt_hash ON generated_images(prompt_hash);

-- Transactions (tracks credits purchases and usage)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
  amount_nok DECIMAL(10,2), -- null for usage transactions
  credits_delta INTEGER NOT NULL, -- positive for purchase, negative for usage
  description TEXT,
  lemon_squeezy_order_id TEXT UNIQUE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_lemon_squeezy_order_id ON transactions(lemon_squeezy_order_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on published_decks
CREATE TRIGGER update_published_decks_updated_at
BEFORE UPDATE ON published_decks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Published decks policies
-- Anyone can read public decks
CREATE POLICY "Anyone can read public decks" ON published_decks
  FOR SELECT USING (visibility = 'public');

-- Users can read their own unlisted decks
CREATE POLICY "Users can read own decks" ON published_decks
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can insert decks
CREATE POLICY "Authenticated users can insert decks" ON published_decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own decks
CREATE POLICY "Users can update own decks" ON published_decks
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own decks
CREATE POLICY "Users can delete own decks" ON published_decks
  FOR DELETE USING (auth.uid() = user_id);

-- Generated images policies
-- Anyone can read images for public decks
CREATE POLICY "Anyone can read public deck images" ON generated_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM published_decks
      WHERE published_decks.id = generated_images.deck_id
      AND published_decks.visibility = 'public'
    )
  );

-- Users can read images for their own decks
CREATE POLICY "Users can read own deck images" ON generated_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM published_decks
      WHERE published_decks.id = generated_images.deck_id
      AND published_decks.user_id = auth.uid()
    )
  );

-- Transactions policies
-- Users can only read their own transactions
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert transactions (for webhook)
-- This will be handled by service role key, not RLS

-- Function to reset daily free decks counter (called by cron job or on-demand)
CREATE OR REPLACE FUNCTION reset_daily_free_decks()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    daily_free_decks_used = 0,
    daily_free_decks_reset_at = NOW()
  WHERE daily_free_decks_reset_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(deck_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE published_decks
  SET view_count = view_count + 1
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE users IS 'Extends Supabase auth.users with app-specific fields';
COMMENT ON TABLE published_decks IS 'Stores both curated (admin) and user-published decks';
COMMENT ON TABLE generated_images IS 'Tracks AI-generated images for cost tracking and deduplication';
COMMENT ON TABLE transactions IS 'Audit trail for all credit purchases and usage';

COMMENT ON COLUMN published_decks.user_id IS 'NULL for admin-curated decks';
COMMENT ON COLUMN published_decks.is_curated IS 'true for admin-created, false for user-published';
COMMENT ON COLUMN published_decks.visibility IS 'public = listed in gallery, unlisted = only accessible via direct link';
