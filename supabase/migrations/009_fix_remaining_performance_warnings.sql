-- Migration: Fix remaining performance warnings
-- 1. Wrap auth.uid() in community_images INSERT policy
-- 2. Combine multiple permissive SELECT policies into single policies

-- Fix 1: community_images INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert images" ON public.community_images;
CREATE POLICY "Authenticated users can insert images"
  ON public.community_images
  FOR INSERT
  TO public
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- Fix 2: Combine generated_images SELECT policies
-- Instead of two separate policies (public OR own), use one policy with OR logic
DROP POLICY IF EXISTS "Anyone can read public deck images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can read own deck images" ON public.generated_images;

CREATE POLICY "Users can read public or own deck images"
  ON public.generated_images
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.published_decks
      WHERE published_decks.id = generated_images.deck_id
        AND (
          published_decks.visibility = 'public'::text
          OR published_decks.user_id = (SELECT auth.uid())
        )
    )
  );

-- Fix 3: Combine published_decks SELECT policies
DROP POLICY IF EXISTS "Anyone can read public decks" ON public.published_decks;
DROP POLICY IF EXISTS "Users can read own decks" ON public.published_decks;

CREATE POLICY "Users can read public or own decks"
  ON public.published_decks
  FOR SELECT
  TO public
  USING (
    visibility = 'public'::text
    OR (SELECT auth.uid()) = user_id
  );

-- End of migration
