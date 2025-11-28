-- Migration: Wrap auth.* and current_setting() calls in SELECT for RLS policies
-- Replace direct calls such as auth.uid() with (SELECT auth.uid())
-- IMPORTANT: Validate in staging before applying to production.

-- 1) public.generated_images policies
DROP POLICY IF EXISTS "Anyone can read public deck images" ON public.generated_images;
CREATE POLICY "Anyone can read public deck images"
  ON public.generated_images
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.published_decks
      WHERE published_decks.id = generated_images.deck_id
        AND published_decks.visibility = 'public'::text
    )
  );

DROP POLICY IF EXISTS "Users can read own deck images" ON public.generated_images;
CREATE POLICY "Users can read own deck images"
  ON public.generated_images
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.published_decks
      WHERE published_decks.id = generated_images.deck_id
        AND published_decks.user_id = (SELECT auth.uid())
    )
  );

-- 2) public.transactions policy
DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
CREATE POLICY "Users can read own transactions"
  ON public.transactions
  FOR SELECT
  TO public
  USING (
    (SELECT auth.uid()) = user_id
  );

-- 3) public.users policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO public
  USING (
    (SELECT auth.uid()) = id
  );

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO public
  USING (
    (SELECT auth.uid()) = id
  );

-- 4) public.published_decks and user_decks policies
DROP POLICY IF EXISTS "Anyone can read public decks" ON public.published_decks;
CREATE POLICY "Anyone can read public decks"
  ON public.published_decks
  FOR SELECT
  TO public
  USING (
    visibility = 'public'::text
  );

DROP POLICY IF EXISTS "Authenticated users can insert decks" ON public.published_decks;
CREATE POLICY "Authenticated users can insert decks"
  ON public.published_decks
  FOR INSERT
  TO public
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can delete own decks" ON public.published_decks;
CREATE POLICY "Users can delete own decks"
  ON public.published_decks
  FOR DELETE
  TO public
  USING (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can read own decks" ON public.published_decks;
CREATE POLICY "Users can read own decks"
  ON public.published_decks
  FOR SELECT
  TO public
  USING (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can update own decks" ON public.published_decks;
CREATE POLICY "Users can update own decks"
  ON public.published_decks
  FOR UPDATE
  TO public
  USING (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can delete own user_decks" ON public.user_decks;
CREATE POLICY "Users can delete own user_decks"
  ON public.user_decks
  FOR DELETE
  TO public
  USING (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can insert own user_decks" ON public.user_decks;
CREATE POLICY "Users can insert own user_decks"
  ON public.user_decks
  FOR INSERT
  TO public
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can read own user_decks" ON public.user_decks;
CREATE POLICY "Users can read own user_decks"
  ON public.user_decks
  FOR SELECT
  TO public
  USING (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can update own user_decks" ON public.user_decks;
CREATE POLICY "Users can update own user_decks"
  ON public.user_decks
  FOR UPDATE
  TO public
  USING (
    (SELECT auth.uid()) = user_id
  );

-- 6) Any other policies referencing auth.uid() should be handled similarly.
--(End of explicit policy updates based on detected list)

-- Index recommendations:
-- Create indexes on columns used in policy predicates to improve performance.
-- Note: Not using CONCURRENTLY because Supabase migrations run inside transactions.

-- For user id columns:
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_published_decks_id ON public.published_decks(id);
CREATE INDEX IF NOT EXISTS idx_published_decks_user_id ON public.published_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_published_decks_visibility ON public.published_decks(visibility);
CREATE INDEX IF NOT EXISTS idx_generated_images_deck_id ON public.generated_images(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id ON public.user_decks(user_id);

-- End of migration