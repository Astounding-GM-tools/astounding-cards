# Image Generation Implementation Details

**Created**: 2025-11-16  
**Status**: Ready to Implement

## Summary of Findings

### ✅ What We Have

#### Authentication & Session

- **Cookies**: `sb-access-token` and `sb-refresh-token` (should be httpOnly, sameSite - verify)
- **Pattern**: All API routes use `cookies.get()` → `supabase.auth.setSession()` → get `user.id`
- **Example**: `src/routes/api/tokens/balance/+server.ts`

#### Database Schema

- ✅ **`users` table**: Has `credits` column
- ✅ **`transactions` table**: Complete schema with type, credits_delta, description
- ✅ **`community_images` table**: Complete with embedding, remix tracking, R2 keys
- ✅ **Helper functions**: `find_image_remix()`, `search_similar_images()`

#### R2 Upload

- ✅ **Function**: `uploadImage()` in `src/lib/server/r2.ts`
- ✅ **Returns**: R2 key (e.g., `dev/cards/abc123.png`)
- ✅ **Public URL**: Constructed via `PUBLIC_R2_PUBLIC_URL` env var

#### Supabase Clients

- ✅ **Client-side**: `src/lib/supabaseClient.ts` (anon key)
- ✅ **Server-side**: `src/lib/server/supabase.ts` (`supabaseAdmin` with service role key)

#### Token Economy

- ✅ **Cost**: 100 tokens = 1 NOK
- ✅ **Config**: `src/lib/config/token-costs.ts`
- ✅ **Welcome bonus**: 500 tokens (via `grant_welcome_bonus()` trigger)

---

### ❌ What We Need to Create

#### 1. Database Function: `deduct_tokens()`

**Location**: `supabase/migrations/003_token_functions.sql` (new file)

```sql
-- Atomically deduct tokens from user's balance
-- Returns TRUE if successful, FALSE if insufficient balance
CREATE OR REPLACE FUNCTION deduct_tokens(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance and lock row for update
  SELECT credits INTO current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has enough tokens
  IF current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct tokens
  UPDATE users
  SET credits = credits - p_amount
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Helper Function: `generateEmbedding()`

**Location**: `src/lib/server/embeddings.ts` (new file)

```typescript
/**
 * Generate text embedding using Gemini text-embedding-001
 *
 * @param text - The optimized prompt text to embed
 * @returns 768-dimensional embedding vector as number array
 */
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';

export async function generateEmbedding(text: string): Promise<number[]> {
	const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

	const result = await ai.models.embedContent({
		model: 'text-embedding-001',
		content: text
	});

	if (!result.embedding?.values) {
		throw new Error('Failed to generate embedding');
	}

	return result.embedding.values;
}
```

#### 3. Helper Function: `getUserFromSession()`

**Location**: `src/lib/server/auth.ts` (new file)

```typescript
/**
 * Extract authenticated user from request cookies
 *
 * @returns User ID or null if not authenticated
 */
import { supabase } from '$lib/supabaseClient';
import type { Cookies } from '@sveltejs/kit';

export async function getUserFromSession(cookies: Cookies): Promise<string | null> {
	const accessToken = cookies.get('sb-access-token');
	const refreshToken = cookies.get('sb-refresh-token');

	if (!accessToken || !refreshToken) {
		return null;
	}

	const {
		data: { user },
		error
	} = await supabase.auth.setSession({
		access_token: accessToken,
		refresh_token: refreshToken
	});

	if (error || !user) {
		return null;
	}

	return user.id;
}
```

---

## Complete Flow Implementation

### Updated `/api/ai/generate-image/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY, PUBLIC_R2_PUBLIC_URL } from '$env/static/private';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '$lib/server/supabase';
import { uploadImage, generateImageFileName } from '$lib/server/r2';
import { generateEmbedding } from '$lib/server/embeddings';
import { getUserFromSession } from '$lib/server/auth';
import { TOKEN_COSTS } from '$lib/config/token-costs';
import { AI_CONFIGS } from '$lib/ai/config/models';
import {
	IMAGE_GENERATION_CONTEXT,
	PROMPT_OPTIMIZATION_CONTEXT,
	ART_STYLES,
	createPromptOptimizationRequest
} from '$lib/ai/prompts/image-generation';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LAYOUT_REFERENCE_BASE64 = readFileSync(
	join(__dirname, '../../../../../static/card-layout-reference.png')
).toString('base64');

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return error(401, 'Authentication required');
		}

		// 2. Parse request
		const { card, deckTheme = 'classic', sourceImageId = null } = await request.json();

		if (!card?.title) {
			return error(400, 'Card title is required');
		}

		const style = deckTheme; // Using deckTheme as style for now

		// 3. Check for existing remix (if this is a style variant)
		if (sourceImageId && style) {
			console.log(`🔍 Checking for existing remix: ${sourceImageId} → ${style}`);

			const { data: existingRemix } = await supabaseAdmin.rpc('find_image_remix', {
				p_source_image_id: sourceImageId,
				p_style: style
			});

			if (existingRemix && existingRemix.length > 0) {
				console.log('✅ Found existing remix, returning cached result');
				return json({
					success: true,
					url: existingRemix[0].url,
					imageId: existingRemix[0].id,
					cost: 0,
					cached: true
				});
			}
		}

		// 4. Check user balance
		const cost = TOKEN_COSTS.IMAGE_GENERATION_COMMUNITY;
		const { data: userData } = await supabaseAdmin
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (!userData || userData.credits < cost) {
			return error(402, 'Insufficient tokens');
		}

		console.log(`🎨 Generating image for "${card.title}" (${style})`);

		// 5. Step 1: Optimize prompt
		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

		const originalPrompt = createPromptOptimizationRequest(
			card.title,
			card.subtitle || '',
			card.description || '',
			deckTheme,
			card.traits || [],
			card.stats || []
		);

		const optimizationResponse = await ai.models.generateContent({
			model: AI_CONFIGS.TEXT_GENERATION.model,
			contents: originalPrompt,
			config: {
				systemInstruction: PROMPT_OPTIMIZATION_CONTEXT,
				temperature: AI_CONFIGS.TEXT_GENERATION.temperature
			}
		});

		const optimizedPrompt = optimizationResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
		if (!optimizedPrompt) {
			throw new Error('Failed to optimize prompt');
		}

		console.log(`✅ Optimized prompt: "${optimizedPrompt.substring(0, 100)}..."`);

		// 6. Step 2: Generate image
		const selectedArtStyle = ART_STYLES[style as keyof typeof ART_STYLES] || ART_STYLES.classic;
		const artStyleInstructions = `${IMAGE_GENERATION_CONTEXT}\n\nArt style: ${selectedArtStyle}\n\nVisual prompt: ${optimizedPrompt}`;

		const contentParts: any[] = [{ text: artStyleInstructions }];

		// Add existing image if provided (for style reference)
		if (card.image) {
			try {
				const imageResponse = await fetch(card.image);
				if (imageResponse.ok) {
					const imageBuffer = await imageResponse.arrayBuffer();
					const imageBase64 = Buffer.from(imageBuffer).toString('base64');
					const mimeType = imageResponse.headers.get('content-type') || 'image/png';
					contentParts.push({
						inlineData: { mimeType, data: imageBase64 }
					});
					console.log('📷 Added existing image for style reference');
				}
			} catch (err) {
				console.warn('⚠️ Failed to fetch existing image:', err);
			}
		}

		// Add layout reference
		contentParts.push({
			inlineData: {
				mimeType: 'image/png',
				data: LAYOUT_REFERENCE_BASE64
			}
		});

		const imageResponse = await ai.models.generateContent({
			model: AI_CONFIGS.IMAGE_GENERATION.model,
			contents: contentParts,
			config: {
				temperature: AI_CONFIGS.IMAGE_GENERATION.temperature
			}
		});

		const imageData = imageResponse.candidates?.[0]?.content?.parts?.find(
			(part: any) => part.inlineData
		);

		if (!imageData?.inlineData?.data) {
			throw new Error('No image data returned from Gemini');
		}

		const base64Data = imageData.inlineData.data;
		const mimeType = imageData.inlineData.mimeType || 'image/png';

		console.log('✅ Image generated successfully');

		// 7. Generate embedding (only for originals)
		let embedding: number[] | null = null;
		if (!sourceImageId) {
			console.log('🧮 Generating embedding for original image...');
			embedding = await generateEmbedding(optimizedPrompt);
			console.log('✅ Embedding generated');
		}

		// 8. Upload to R2
		const imageBuffer = Buffer.from(base64Data, 'base64');
		const extension = mimeType.split('/')[1];
		const fileName = generateImageFileName(card.id || 'unknown', extension);
		const r2Key = await uploadImage(imageBuffer, fileName, mimeType);
		const publicUrl = PUBLIC_R2_PUBLIC_URL ? `${PUBLIC_R2_PUBLIC_URL}/${r2Key}` : r2Key;

		console.log(`✅ Uploaded to R2: ${publicUrl}`);

		// 9. Deduct tokens atomically
		const { data: deductSuccess, error: deductError } = await supabaseAdmin.rpc('deduct_tokens', {
			p_user_id: userId,
			p_amount: cost
		});

		if (deductError || !deductSuccess) {
			console.error('❌ Token deduction failed:', deductError);
			// TODO: Should we clean up the uploaded image here?
			return error(402, 'Failed to deduct tokens');
		}

		console.log(`✅ Deducted ${cost} tokens from user ${userId}`);

		// 10. Save to community_images
		const { data: imageRecord, error: dbError } = await supabaseAdmin
			.from('community_images')
			.insert({
				user_id: userId,
				url: publicUrl,
				r2_key: r2Key,
				style,
				source_image_id: sourceImageId || null,
				embedding: embedding ? `[${embedding.join(',')}]` : null,
				card_title: card.title,
				cost_tokens: cost
			})
			.select()
			.single();

		if (dbError) {
			console.error('❌ Database insert failed:', dbError);
			// Tokens already deducted - this is a partial failure
			// TODO: Should we refund tokens here?
			return error(500, 'Failed to save image record');
		}

		console.log(`✅ Image record saved: ${imageRecord.id}`);

		// 11. Record transaction
		const { error: txError } = await supabaseAdmin.from('transactions').insert({
			user_id: userId,
			type: 'usage',
			amount_nok: null,
			credits_delta: -cost,
			description: `AI image generation: ${card.title}`,
			status: 'completed'
		});

		if (txError) {
			console.error('⚠️ Transaction recording failed:', txError);
			// Non-critical - image was generated and tokens were deducted
		}

		console.log('✅ Transaction recorded');

		// 12. Return success
		return json({
			success: true,
			url: publicUrl,
			imageId: imageRecord.id,
			cost,
			cached: false,
			optimizedPrompt // For debugging/transparency
		});
	} catch (err) {
		console.error('Image generation API error:', err);
		return error(500, err instanceof Error ? err.message : 'Failed to generate image');
	}
};
```

---

## Cookie Security Verification

**Check**: Are cookies httpOnly and sameSite secure?

**Location to verify**:

- SvelteKit auth setup (likely in auth callback/hook)
- Supabase Auth cookie settings

**Expected**:

```typescript
cookies.set('sb-access-token', accessToken, {
	httpOnly: true,
	secure: true, // HTTPS only
	sameSite: 'lax', // or 'strict'
	path: '/',
	maxAge: 60 * 60 * 24 * 7 // 7 days
});
```

---

## Testing Checklist

### Unit Tests

- [ ] `generateEmbedding()` returns 768-dim array
- [ ] `getUserFromSession()` handles invalid cookies
- [ ] `deduct_tokens()` SQL function works atomically

### Integration Tests

- [ ] Generate image with sufficient tokens → success
- [ ] Generate image with insufficient tokens → 402 error
- [ ] Generate remix when original exists → cached result (0 cost)
- [ ] Unauthenticated request → 401 error
- [ ] Token balance updates correctly
- [ ] Transaction recorded in database
- [ ] Image saved to R2 with correct URL
- [ ] Embedding generated only for originals

### E2E Tests

- [ ] Full flow: login → generate image → check balance → verify image in library
- [ ] Remix flow: generate original → generate variant → verify cached

---

## Migration Order

1. **Create migration file**: `supabase/migrations/003_token_functions.sql`
   - Add `deduct_tokens()` function
2. **Create helper files**:
   - `src/lib/server/embeddings.ts`
   - `src/lib/server/auth.ts`

3. **Update API route**: `src/routes/api/ai/generate-image/+server.ts`
   - Implement full flow with all steps

4. **Verify cookie security** in auth setup

5. **Test thoroughly** before moving to UI integration

---

## Next Steps After This

Once image generation is complete:

1. Update `AiImageGenerationDialog.svelte` to handle new response format
2. Migrate `BatchImageGenerationDialog.svelte`
3. Update `CardEditDialog.svelte`
4. Remove BYOK components
5. Create image search API (optional enhancement)
