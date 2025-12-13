# Package Pricing Migration

## Why Package Pricing?

We migrated from description-based token parsing to Lemon Squeezy's **Package Pricing** feature for several important reasons:

### ❌ Old Approach: Description Parsing

**Problem**: Parsing token counts from variant descriptions was brittle and error-prone.

```typescript
// Old code - fragile!
function parseTokenCount(description: string): number {
  const match = description.match(/([\d.,\s]+)\s*(?:test\s+)?tokens?/i);
  // What if format changes?
  // What if description is missing?
  // What if there are multiple numbers?
  // ...lots of edge cases
}
```

**Issues**:
- 🔴 Brittle: Breaks if description format changes
- 🔴 Unreliable: Requires specific text format ("5000 tokens", "15.000 Test Tokens", etc.)
- 🔴 Manual: Need to update descriptions carefully
- 🔴 Error-prone: Typos in descriptions break parsing
- 🔴 No standard: Each variant could use different formats

### ✅ New Approach: Package Pricing

**Solution**: Use Lemon Squeezy's built-in Package Pricing feature.

```typescript
// New code - robust!
function getTokenCount(variant: LemonSqueezyVariant): number {
  return variant.price_model?.package_size ?? 0;
  // Direct field access - no parsing!
}
```

**Benefits**:
- ✅ **Structured data**: `price_model.package_size` is a dedicated field
- ✅ **Reliable**: No parsing, no format requirements
- ✅ **Standard**: Built into Lemon Squeezy's pricing model
- ✅ **Usage-based**: Supports quantity calculations automatically
- ✅ **Future-proof**: If user buys 2x packages, LS calculates it
- ✅ **Clean UI**: Configure in LS dashboard, not in descriptions

## What is Package Pricing?

From [Lemon Squeezy docs](https://docs.lemonsqueezy.com/help/products/package-pricing):

> Package pricing lets you charge a fixed amount for a fixed amount of units.
>
> For example, you can sell packages of API credits at a certain price. As usage increases past the package's unit limit, you would charge for an additional package.
>
> Changing the quantity value will charge customers based on how many packages need to be bought for that quantity.

**Example**: Sell 5000 tokens for $5

- User buys 1 package → $5 → 5000 tokens
- User buys 2 packages → $10 → 10,000 tokens
- User buys 12,000 tokens → 3 packages → $15

Lemon Squeezy automatically calculates how many packages are needed!

## How to Configure

### 1. Enable Package Pricing for a Variant

1. Go to Lemon Squeezy → Products → Edit Product
2. Click on a variant (e.g., "Small")
3. Scroll to **"Advanced pricing"**
4. Enable **"Package pricing"**
5. Set **"Package size"** to the number of tokens:
   - Small: `5000`
   - Medium: `15000`
   - Mega: `25000`
6. Save

### 2. Verify Configuration

Run the inspection script:

```bash
npx tsx scripts/inspect-package-pricing.ts
```

You should see:

```
2. Small (ID: 1146779)
   Price: $5
   Status: published
   Sort: 2
   Package Pricing:
     Scheme: package
     Package Size: 5000  ← This is what we use!
     Rate: 1000 tokens per $1
```

### 3. What the API Returns

When you fetch variants with `include=price-model`:

```json
{
  "data": [
    {
      "type": "variants",
      "id": "1146779",
      "attributes": {
        "name": "Small",
        "price": 500,
        "status": "published"
      },
      "relationships": {
        "price-model": {
          "data": {
            "type": "price-models",
            "id": "12345"
          }
        }
      }
    }
  ],
  "included": [
    {
      "type": "price-models",
      "id": "12345",
      "attributes": {
        "scheme": "package",
        "package_size": 5000  ← Direct access!
      }
    }
  ]
}
```

## Code Changes

### Updated Types (lemonSqueezyClient.ts)

```typescript
export interface LemonSqueezyPriceModel {
  id: string;
  scheme: 'standard' | 'package' | 'graduated' | 'volume';
  package_size?: number; // Number of tokens per package
  usage_aggregation?: string;
}

export interface LemonSqueezyVariant {
  // ... other fields
  price_model?: LemonSqueezyPriceModel; // NEW!
}
```

### Updated API Fetching (lemonSqueezyClient.ts)

```typescript
export async function getVariants(productId: string) {
  // Include price-model relationship
  const response = await fetch(
    `${API_BASE_URL}/variants?filter[product_id]=${productId}&include=price-model`,
    { headers: getHeaders() }
  );

  // Parse price models from included data
  const priceModels = new Map();
  data.included?.forEach((item: any) => {
    if (item.type === 'price-models') {
      priceModels.set(item.id, {
        scheme: item.attributes.scheme,
        package_size: item.attributes.package_size
      });
    }
  });

  // Attach price model to each variant
  return data.data.map(variant => ({
    // ... other fields
    price_model: priceModels.get(priceModelId)
  }))
  .filter(v =>
    v.status === 'published' &&
    v.price_model?.scheme === 'package' &&  // Only package pricing!
    v.price_model?.package_size              // Must have size set!
  );
}
```

### Updated Token Parsing (lemonSqueezyVariants.ts)

```typescript
// OLD: Fragile description parsing
function parseTokenCount(description: string, priceInCents: number): number {
  const match = description.match(/([\d.,\s]+)\s*(?:test\s+)?tokens?/i);
  // ... complex regex parsing with fallbacks
}

// NEW: Simple direct access
function getTokenCount(variant: LemonSqueezyVariant): number {
  if (variant.price_model?.package_size) {
    return variant.price_model.package_size;
  }
  // Fallback (shouldn't happen due to filtering)
  console.warn('No package_size, estimating from price');
  return Math.round((variant.price / 100) * 1000);
}
```

## Migration Checklist

If you're migrating existing products:

- [ ] For each variant in Lemon Squeezy:
  - [ ] Edit variant
  - [ ] Enable "Package pricing" in Advanced pricing
  - [ ] Set "Package size" to token count
  - [ ] Save
- [ ] Verify with `npx tsx scripts/inspect-package-pricing.ts`
- [ ] Test locally with `npm run dev`
- [ ] Test checkout flow with test card
- [ ] Verify tokens appear in UI after "purchase"

## Benefits Recap

| Feature | Description Parsing | Package Pricing |
|---------|-------------------|-----------------|
| Reliability | ❌ Breaks if format changes | ✅ Structured API field |
| Setup | ❌ Manual text formatting | ✅ UI toggle + number input |
| Validation | ❌ Regex matching | ✅ Native LS validation |
| Maintainability | ❌ Update descriptions carefully | ✅ Update one number field |
| Quantity Support | ❌ Manual calculation | ✅ Automatic by LS |
| Error Handling | ❌ Fallbacks and guessing | ✅ Clear null checks |
| Future-proof | ❌ Custom parsing logic | ✅ Standard LS feature |

## Testing

```bash
# 1. Verify package pricing is configured
npx tsx scripts/inspect-package-pricing.ts

# 2. Start dev server
npm run dev

# 3. Test the token store page
# Visit: http://localhost:5173/dashboard
# Click "Buy Tokens"
# Verify correct token counts display

# 4. Test checkout (optional - requires ngrok)
# Follow WEBHOOK_TESTING.md for full flow
```

## Further Reading

- [Lemon Squeezy: Package Pricing](https://docs.lemonsqueezy.com/help/products/package-pricing)
- [Lemon Squeezy: Price Models API](https://docs.lemonsqueezy.com/api/price-models)
- [LEMON_SQUEEZY_SETUP.md](./LEMON_SQUEEZY_SETUP.md) - Complete setup guide
- [WEBHOOK_TESTING.md](./WEBHOOK_TESTING.md) - Testing webhooks locally
